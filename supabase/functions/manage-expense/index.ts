import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // Use postgresjs for atomic transactions
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
    const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.5/mod.js");
    const sql = postgres(dbUrl, { max: 1 });

    try {
      let result: any;
      if (action === "create") {
        result = await handleCreate(sql, body);
      } else if (action === "delete") {
        result = await handleDelete(sql, body);
      } else if (action === "update") {
        result = await handleUpdate(sql, body);
      } else {
        await sql.end();
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await sql.end();
      return new Response(JSON.stringify(result), {
        status: result.error ? result.status || 400 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (dbError: any) {
      await sql.end();
      console.error("Transaction failed:", dbError);
      return new Response(
        JSON.stringify({ error: dbError.message || "Transaction error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    console.error("manage-expense error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function cascadeResync(tx: any, ingredientId: string) {
  // Recalc stock
  const [stockRow] = await tx`
    SELECT COALESCE(SUM(quantity_remaining), 0) as total_stock
    FROM public.ingredient_batches
    WHERE ingredient_id = ${ingredientId}
  `;
  // Recalc weighted avg cost (pesos → cents for costo_unitario)
  const [costRow] = await tx`
    SELECT CASE WHEN SUM(quantity_remaining) > 0
      THEN ROUND(SUM(quantity_remaining * unit_cost) / SUM(quantity_remaining) * 100)
      ELSE 0 END as avg_cost_cents
    FROM public.ingredient_batches
    WHERE ingredient_id = ${ingredientId} AND quantity_remaining > 0
  `;

  await tx`
    UPDATE public.ingredients
    SET stock_actual = ${Number(stockRow.total_stock)},
        costo_unitario = CASE WHEN ${Number(stockRow.total_stock)} > 0
          THEN ${Number(costRow.avg_cost_cents)}
          ELSE costo_unitario END
    WHERE id = ${ingredientId}
  `;

  // Resync products using this ingredient
  const affectedProducts = await tx`
    SELECT DISTINCT product_id FROM public.recipes WHERE ingredient_id = ${ingredientId}
  `;
  for (const { product_id } of affectedProducts) {
    const [costCalc] = await tx`
      SELECT COALESCE(SUM(r.quantity * (i.costo_unitario / 100.0)), 0) as unit_cost
      FROM public.recipes r
      JOIN public.ingredients i ON i.id = r.ingredient_id
      WHERE r.product_id = ${product_id}
    `;
    const calcCost = Number(costCalc.unit_cost);
    if (calcCost > 0) {
      await tx`UPDATE public.products SET unit_cost = ROUND(${calcCost}) WHERE id = ${product_id}`;
    }
  }
}

async function handleCreate(sql: any, body: any) {
  const { category, description, date, payment_method, supplier, ingredient_id, quantity, unit_price, amount } = body;

  if (category === "materia_prima") {
    if (!ingredient_id || !quantity || quantity <= 0 || !unit_price || unit_price <= 0) {
      return { error: "materia_prima requiere ingredient_id, quantity > 0, unit_price > 0", status: 400 };
    }

    const computedAmount = Math.round(quantity * unit_price);
    const expDate = date || new Date().toISOString().split("T")[0];

    const result = await sql.begin(async (tx: any) => {
      // 1. Insert expense
      const [expense] = await tx`
        INSERT INTO public.expenses (category, type, description, date, payment_method, supplier, ingredient_id, quantity, unit_price, amount)
        VALUES (${category}, ${category}, ${description || ""}, ${expDate}, ${payment_method || "efectivo"}, ${supplier || ""}, ${ingredient_id}, ${quantity}, ${unit_price}, ${computedAmount})
        RETURNING id
      `;

      // 2. Insert batch
      const [batch] = await tx`
        INSERT INTO public.ingredient_batches (ingredient_id, quantity_total, quantity_remaining, unit_cost, purchase_date, supplier)
        VALUES (${ingredient_id}, ${quantity}, ${quantity}, ${unit_price}, ${expDate}, ${supplier || ""})
        RETURNING id
      `;

      // 3. Link batch_id
      await tx`UPDATE public.expenses SET batch_id = ${batch.id} WHERE id = ${expense.id}`;

      // 4. Cascade resync (inside same transaction)
      await cascadeResync(tx, ingredient_id);

      return { success: true, id: expense.id };
    });

    return result;
  }

  // Non-materia_prima
  if (!amount || amount <= 0) {
    return { error: "amount > 0 requerido", status: 400 };
  }

  const expDate = date || new Date().toISOString().split("T")[0];
  const result = await sql.begin(async (tx: any) => {
    const [expense] = await tx`
      INSERT INTO public.expenses (category, type, description, date, payment_method, supplier, amount, ingredient_id, quantity, unit_price, batch_id)
      VALUES (${category}, ${category}, ${description || ""}, ${expDate}, ${payment_method || "efectivo"}, ${supplier || ""}, ${Math.round(amount)}, ${null}, ${null}, ${null}, ${null})
      RETURNING id
    `;
    return { success: true, id: expense.id };
  });

  return result;
}

async function handleDelete(sql: any, body: any) {
  const { expense_id } = body;
  if (!expense_id) return { error: "expense_id requerido", status: 400 };

  const result = await sql.begin(async (tx: any) => {
    const [expense] = await tx`SELECT * FROM public.expenses WHERE id = ${expense_id}`;
    if (!expense) throw new Error("Gasto no encontrado");

    // If materia_prima with batch, delete batch and resync
    if (expense.batch_id) {
      await tx`DELETE FROM public.ingredient_batches WHERE id = ${expense.batch_id}`;
      if (expense.ingredient_id) {
        await cascadeResync(tx, expense.ingredient_id);
      }
    }

    await tx`DELETE FROM public.expenses WHERE id = ${expense_id}`;
    return { success: true };
  });

  return result;
}

async function handleUpdate(sql: any, body: any) {
  const { expense_id, category, description, date, payment_method, supplier, ingredient_id, quantity, unit_price, amount } = body;
  if (!expense_id) return { error: "expense_id requerido", status: 400 };

  const result = await sql.begin(async (tx: any) => {
    const [oldExpense] = await tx`SELECT * FROM public.expenses WHERE id = ${expense_id}`;
    if (!oldExpense) throw new Error("Gasto no encontrado");

    // Remove old batch if existed
    if (oldExpense.batch_id) {
      await tx`DELETE FROM public.ingredient_batches WHERE id = ${oldExpense.batch_id}`;
      if (oldExpense.ingredient_id) {
        await cascadeResync(tx, oldExpense.ingredient_id);
      }
    }

    if (category === "materia_prima") {
      if (!ingredient_id || !quantity || quantity <= 0 || !unit_price || unit_price <= 0) {
        throw new Error("materia_prima requiere ingredient_id, quantity > 0, unit_price > 0");
      }

      const computedAmount = Math.round(quantity * unit_price);
      const expDate = date || oldExpense.date;

      // Create new batch
      const [batch] = await tx`
        INSERT INTO public.ingredient_batches (ingredient_id, quantity_total, quantity_remaining, unit_cost, purchase_date, supplier)
        VALUES (${ingredient_id}, ${quantity}, ${quantity}, ${unit_price}, ${expDate}, ${supplier || ""})
        RETURNING id
      `;

      await tx`
        UPDATE public.expenses SET
          category = ${category}, type = ${category}, description = ${description || ""},
          date = ${expDate}, payment_method = ${payment_method || "efectivo"},
          supplier = ${supplier || ""}, ingredient_id = ${ingredient_id},
          quantity = ${quantity}, unit_price = ${unit_price},
          amount = ${computedAmount}, batch_id = ${batch.id}
        WHERE id = ${expense_id}
      `;

      await cascadeResync(tx, ingredient_id);
    } else {
      if (!amount || amount <= 0) throw new Error("amount > 0 requerido");

      await tx`
        UPDATE public.expenses SET
          category = ${category}, type = ${category}, description = ${description || ""},
          date = ${date || oldExpense.date}, payment_method = ${payment_method || "efectivo"},
          supplier = ${supplier || ""}, amount = ${Math.round(amount)},
          ingredient_id = ${null}, quantity = ${null}, unit_price = ${null}, batch_id = ${null}
        WHERE id = ${expense_id}
      `;
    }

    return { success: true };
  });

  return result;
}
