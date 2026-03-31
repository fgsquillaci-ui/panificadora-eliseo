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

    if (action === "create") {
      return await handleCreate(supabase, body, corsHeaders);
    } else if (action === "delete") {
      return await handleDelete(supabase, body, corsHeaders);
    } else if (action === "update") {
      return await handleUpdate(supabase, body, corsHeaders);
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("manage-expense error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function cascadeResync(supabase: any, ingredientId: string) {
  const { data: batches } = await supabase
    .from("ingredient_batches")
    .select("quantity_remaining, unit_cost")
    .eq("ingredient_id", ingredientId)
    .gt("quantity_remaining", 0);

  const remaining = batches || [];
  const totalStock = remaining.reduce((s: number, b: any) => s + Number(b.quantity_remaining), 0);
  const totalValue = remaining.reduce(
    (s: number, b: any) => s + Number(b.quantity_remaining) * Number(b.unit_cost),
    0
  );
  const weightedAvgPesos = totalStock > 0 ? totalValue / totalStock : 0;
  const costoUnitarioCents = Math.round(weightedAvgPesos * 100);

  await supabase
    .from("ingredients")
    .update({ stock_actual: totalStock, costo_unitario: costoUnitarioCents })
    .eq("id", ingredientId);

  const { data: recipeRows } = await supabase
    .from("recipes")
    .select("product_id")
    .eq("ingredient_id", ingredientId);

  const productIds = [...new Set((recipeRows || []).map((r: any) => r.product_id))];

  for (const productId of productIds) {
    const { data: recipeLines } = await supabase
      .from("recipes")
      .select("quantity, ingredients(costo_unitario)")
      .eq("product_id", productId);

    const unitCost = (recipeLines || []).reduce((s: number, r: any) => {
      const costoUnitario = r.ingredients?.costo_unitario || 0;
      return s + Number(r.quantity) * (costoUnitario / 100);
    }, 0);

    await supabase
      .from("products")
      .update({ unit_cost: Math.round(unitCost) })
      .eq("id", productId);
  }
}

async function handleCreate(supabase: any, body: any, headers: Record<string, string>) {
  const { category, description, date, payment_method, supplier, ingredient_id, quantity, unit_price, amount } = body;

  if (category === "materia_prima") {
    if (!ingredient_id || !quantity || quantity <= 0 || !unit_price || unit_price <= 0) {
      return new Response(
        JSON.stringify({ error: "materia_prima requiere ingredient_id, quantity > 0, unit_price > 0" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const computedAmount = Math.round(quantity * unit_price);

    // 1. Insert expense
    const { data: expense, error: expError } = await supabase
      .from("expenses")
      .insert({
        category,
        type: category,
        description: description || "",
        date: date || new Date().toISOString().split("T")[0],
        payment_method: payment_method || "efectivo",
        supplier: supplier || "",
        ingredient_id,
        quantity,
        unit_price,
        amount: computedAmount,
      })
      .select("id")
      .single();

    if (expError) {
      return new Response(JSON.stringify({ error: expError.message }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // 2. Insert batch
    const { data: batch, error: batchError } = await supabase
      .from("ingredient_batches")
      .insert({
        ingredient_id,
        quantity_total: quantity,
        quantity_remaining: quantity,
        unit_cost: unit_price,
        purchase_date: date || new Date().toISOString().split("T")[0],
        supplier: supplier || "",
      })
      .select("id")
      .single();

    if (batchError) {
      // Rollback: delete expense
      await supabase.from("expenses").delete().eq("id", expense.id);
      return new Response(JSON.stringify({ error: batchError.message }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    // 3. Link batch_id to expense
    await supabase.from("expenses").update({ batch_id: batch.id }).eq("id", expense.id);

    // 4. Cascade resync
    await cascadeResync(supabase, ingredient_id);

    return new Response(JSON.stringify({ success: true, id: expense.id }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // Non-materia_prima
  if (!amount || amount <= 0) {
    return new Response(JSON.stringify({ error: "amount > 0 requerido" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      category,
      type: category,
      description: description || "",
      date: date || new Date().toISOString().split("T")[0],
      payment_method: payment_method || "efectivo",
      supplier: supplier || "",
      amount: Math.round(amount),
      ingredient_id: null,
      quantity: null,
      unit_price: null,
      batch_id: null,
    })
    .select("id")
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, id: expense.id }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

async function handleDelete(supabase: any, body: any, headers: Record<string, string>) {
  const { expense_id } = body;
  if (!expense_id) {
    return new Response(JSON.stringify({ error: "expense_id requerido" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const { data: expense } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expense_id)
    .single();

  if (!expense) {
    return new Response(JSON.stringify({ error: "Gasto no encontrado" }), {
      status: 404,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // If materia_prima with batch, delete batch and resync
  if (expense.batch_id) {
    const ingredientId = expense.ingredient_id;
    await supabase.from("ingredient_batches").delete().eq("id", expense.batch_id);
    if (ingredientId) {
      await cascadeResync(supabase, ingredientId);
    }
  }

  await supabase.from("expenses").delete().eq("id", expense_id);

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

async function handleUpdate(supabase: any, body: any, headers: Record<string, string>) {
  const { expense_id, category, description, date, payment_method, supplier, ingredient_id, quantity, unit_price, amount } = body;

  if (!expense_id) {
    return new Response(JSON.stringify({ error: "expense_id requerido" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const { data: oldExpense } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expense_id)
    .single();

  if (!oldExpense) {
    return new Response(JSON.stringify({ error: "Gasto no encontrado" }), {
      status: 404,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  // Remove old batch if existed
  if (oldExpense.batch_id) {
    const oldIngredientId = oldExpense.ingredient_id;
    await supabase.from("ingredient_batches").delete().eq("id", oldExpense.batch_id);
    if (oldIngredientId) {
      await cascadeResync(supabase, oldIngredientId);
    }
  }

  if (category === "materia_prima") {
    if (!ingredient_id || !quantity || quantity <= 0 || !unit_price || unit_price <= 0) {
      return new Response(
        JSON.stringify({ error: "materia_prima requiere ingredient_id, quantity > 0, unit_price > 0" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const computedAmount = Math.round(quantity * unit_price);

    // Create new batch
    const { data: batch, error: batchError } = await supabase
      .from("ingredient_batches")
      .insert({
        ingredient_id,
        quantity_total: quantity,
        quantity_remaining: quantity,
        unit_cost: unit_price,
        purchase_date: date || new Date().toISOString().split("T")[0],
        supplier: supplier || "",
      })
      .select("id")
      .single();

    if (batchError) {
      return new Response(JSON.stringify({ error: batchError.message }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("expenses")
      .update({
        category,
        type: category,
        description: description || "",
        date: date || oldExpense.date,
        payment_method: payment_method || "efectivo",
        supplier: supplier || "",
        ingredient_id,
        quantity,
        unit_price,
        amount: computedAmount,
        batch_id: batch.id,
      })
      .eq("id", expense_id);

    await cascadeResync(supabase, ingredient_id);
  } else {
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "amount > 0 requerido" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("expenses")
      .update({
        category,
        type: category,
        description: description || "",
        date: date || oldExpense.date,
        payment_method: payment_method || "efectivo",
        supplier: supplier || "",
        amount: Math.round(amount),
        ingredient_id: null,
        quantity: null,
        unit_price: null,
        batch_id: null,
      })
      .eq("id", expense_id);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
