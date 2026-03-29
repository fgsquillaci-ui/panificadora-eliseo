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
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.items || body.items.length === 0) {
      return new Response(JSON.stringify({ error: "Sin productos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.payment_method) {
      return new Response(JSON.stringify({ error: "Falta método de pago" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate each item
    for (const item of body.items) {
      if (!item.product_id || !item.product_name) {
        return new Response(JSON.stringify({ error: "Item sin producto válido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (item.quantity <= 0) {
        return new Response(JSON.stringify({ error: `Cantidad inválida para ${item.product_name}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (item.unit_price <= 0) {
        return new Response(JSON.stringify({ error: `Precio inválido para ${item.product_name}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Validate total matches sum of items
    const calculatedTotal = body.items.reduce((sum, i) => sum + i.total, 0);
    if (calculatedTotal !== body.total) {
      return new Response(
        JSON.stringify({ error: "Total no coincide con la suma de items", expected: calculatedTotal, received: body.total }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure user_id matches authenticated user
    if (body.user_id !== userId) {
      return new Response(JSON.stringify({ error: "User ID mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute atomic transaction via raw SQL using service role
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
            ${body.customer_name},
            ${body.customer_phone},
            ${body.customer_id},
            ${body.address},
            ${body.delivery_type},
            ${body.total},
            ${body.status || "pendiente"},
            ${body.user_id},
            ${body.created_by},
            ${body.reseller_name},
            ${body.payment_method}
          )
          RETURNING id
        `;

        const orderId = order.id;

        // Insert all items
        for (const item of body.items) {
          await tx`
            INSERT INTO public.order_items (
              order_id, product_id, product_name,
              quantity, unit_price, total,
              cost_snapshot, margin_snapshot, pricing_tier_applied
            ) VALUES (
              ${orderId},
              ${item.product_id},
              ${item.product_name},
              ${item.quantity},
              ${item.unit_price},
              ${item.total},
              ${item.cost_snapshot},
              ${item.margin_snapshot},
              ${item.pricing_tier_applied}
            )
          `;
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
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
