import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  cost_snapshot: number | null;
  margin_snapshot: number | null;
  pricing_tier_applied: string | null;
}

interface OrderPayload {
  customer_name: string;
  customer_phone: string | null;
  customer_id: string;
  address: string | null;
  delivery_type: string;
  total: number;
  status: string;
  user_id: string;
  created_by: string;
  reseller_name: string | null;
  payment_method: string;
  items: OrderItem[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify JWT
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;
    const body: OrderPayload = await req.json();

    // Validate
    if (!body.customer_name || !body.customer_id) {
      return new Response(JSON.stringify({ error: "Faltan datos del cliente" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.items || body.items.length === 0) {
      return new Response(JSON.stringify({ error: "Sin productos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.payment_method) {
      return new Response(JSON.stringify({ error: "Falta método de pago" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const item of body.items) {
      if (!item.product_id || !item.product_name) {
        return new Response(JSON.stringify({ error: "Item sin producto válido" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (item.quantity <= 0) {
        return new Response(JSON.stringify({ error: `Cantidad inválida para ${item.product_name}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (item.unit_price <= 0) {
        return new Response(JSON.stringify({ error: `Precio inválido para ${item.product_name}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const calculatedTotal = Math.round(body.items.reduce((sum, i) => sum + i.total, 0));
    const receivedTotal = Math.round(body.total);
    if (calculatedTotal !== receivedTotal) {
      return new Response(
        JSON.stringify({ error: "Total no coincide con la suma de items", expected: calculatedTotal, received: receivedTotal }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.user_id !== userId) {
      return new Response(JSON.stringify({ error: "User ID mismatch" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute atomic transaction
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
    const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.5/mod.js");
    const sql = postgres(dbUrl, { max: 1 });

    try {
      const result = await sql.begin(async (tx: any) => {
        // Insert order
        const [order] = await tx`
          INSERT INTO public.orders (
            customer_name, customer_phone, customer_id,
            address, delivery_type, total, status,
            user_id, created_by, reseller_name, payment_method
          ) VALUES (
            ${body.customer_name}, ${body.customer_phone}, ${body.customer_id},
            ${body.address}, ${body.delivery_type}, ${Math.round(body.total)},
            ${body.status || "pendiente"}, ${body.user_id}, ${body.created_by},
            ${body.reseller_name}, ${body.payment_method}
          ) RETURNING id
        `;
        const orderId = order.id;

        // Track affected ingredients for post-transaction resync
        const affectedIngredients = new Set<string>();

        // Process each item with FIFO consumption
        for (const item of body.items) {
          // Get recipe for this product
          const recipeRows = await tx`
            SELECT r.ingredient_id, r.quantity as recipe_qty, i.name as ingredient_name, i.unit as ingredient_unit
            FROM public.recipes r
            JOIN public.ingredients i ON i.id = r.ingredient_id
            WHERE r.product_id = ${item.product_id}
          `;

          let itemCostPesos = 0;
          const hasRecipe = recipeRows.length > 0;

          if (hasRecipe) {
            // FIFO consumption for each recipe ingredient
            for (const recipe of recipeRows) {
              const neededQty = Number(recipe.recipe_qty) * item.quantity;
              let remaining = neededQty;

              // Get batches in FIFO order
              const batches = await tx`
                SELECT id, quantity_remaining, unit_cost
                FROM public.ingredient_batches
                WHERE ingredient_id = ${recipe.ingredient_id}
                  AND quantity_remaining > 0
                ORDER BY purchase_date ASC, created_at ASC, id ASC
                FOR UPDATE
              `;

              for (const batch of batches) {
                if (remaining <= 0) break;
                const consume = Math.min(Number(batch.quantity_remaining), remaining);
                itemCostPesos += consume * Number(batch.unit_cost);
                remaining -= consume;

                await tx`
                  UPDATE public.ingredient_batches
                  SET quantity_remaining = quantity_remaining - ${consume}
                  WHERE id = ${batch.id}
                `;
              }

              if (remaining > 0) {
                throw new Error(`Stock insuficiente: ${recipe.ingredient_name} (faltan ${remaining.toFixed(2)} ${recipe.ingredient_unit})`);
              }

              affectedIngredients.add(recipe.ingredient_id);
            }
          }

          // cost_snapshot in pesos (no scaling)
          const costSnapshot = hasRecipe ? itemCostPesos : (item.cost_snapshot ?? null);
          const marginSnapshot = hasRecipe && itemCostPesos > 0 && item.total > 0
            ? ((item.total - itemCostPesos) / item.total) * 100
            : item.margin_snapshot;

          await tx`
            INSERT INTO public.order_items (
              order_id, product_id, product_name,
              quantity, unit_price, total,
              cost_snapshot, margin_snapshot, pricing_tier_applied
            ) VALUES (
              ${orderId}, ${item.product_id}, ${item.product_name},
              ${item.quantity}, ${Math.round(item.unit_price)}, ${Math.round(item.total)},
              ${costSnapshot}, ${marginSnapshot}, ${item.pricing_tier_applied}
            )
          `;
        }

        // Resync affected ingredients stock + cost
        for (const ingId of affectedIngredients) {
          // Recalc stock
          const [stockRow] = await tx`
            SELECT COALESCE(SUM(quantity_remaining), 0) as total_stock
            FROM public.ingredient_batches
            WHERE ingredient_id = ${ingId}
          `;
          // Recalc weighted avg cost (in pesos → cents for costo_unitario)
          const [costRow] = await tx`
            SELECT CASE WHEN SUM(quantity_remaining) > 0
              THEN ROUND(SUM(quantity_remaining * unit_cost) / SUM(quantity_remaining) * 100)
              ELSE 0 END as avg_cost_cents
            FROM public.ingredient_batches
            WHERE ingredient_id = ${ingId} AND quantity_remaining > 0
          `;

          await tx`
            UPDATE public.ingredients
            SET stock_actual = ${Number(stockRow.total_stock)},
                costo_unitario = CASE WHEN ${Number(stockRow.total_stock)} > 0
                  THEN ${Number(costRow.avg_cost_cents)}
                  ELSE costo_unitario END
            WHERE id = ${ingId}
          `;

          // Resync products using this ingredient
          const affectedProducts = await tx`
            SELECT DISTINCT product_id FROM public.recipes WHERE ingredient_id = ${ingId}
          `;
          for (const { product_id } of affectedProducts) {
            const [costCalc] = await tx`
              SELECT COALESCE(SUM(r.quantity * (i.costo_unitario / 100.0)), 0) as unit_cost
              FROM public.recipes r
              JOIN public.ingredients i ON i.id = r.ingredient_id
              WHERE r.product_id = ${product_id}
            `;
            await tx`
              UPDATE public.products SET unit_cost = ROUND(${Number(costCalc.unit_cost)})
              WHERE id = ${product_id}
            `;
          }
        }

        // Insert order history
        await tx`
          INSERT INTO public.order_history (order_id, action, new_value, user_id)
          VALUES (${orderId}, 'created', ${"total:" + body.total}, ${body.user_id})
        `;

        return { id: orderId };
      });

      await sql.end();
      return new Response(JSON.stringify({ id: result.id }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (dbError: any) {
      await sql.end();
      console.error("Transaction failed:", dbError);
      return new Response(
        JSON.stringify({ error: "Error al crear pedido", detail: dbError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Error inesperado", detail: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
