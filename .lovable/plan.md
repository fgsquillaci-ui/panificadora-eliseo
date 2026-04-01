

## Final Refactor: Remove Stock/FIFO + Recipe-Only Cost + NaN Safety

### Changes

**1. `supabase/functions/create-order/index.ts` — Replace lines 144-282**

Remove all FIFO/batches/resync/warnings logic. Replace with clean recipe-based cost:

```ts
// Process each item — recipe-based cost only, no stock
for (const item of body.items) {
  const recipeRows = await tx`
    SELECT r.quantity as recipe_qty, i.costo_unitario
    FROM public.recipes r
    JOIN public.ingredients i ON i.id = r.ingredient_id
    WHERE r.product_id = ${item.product_id}
  `;

  const hasRecipe = recipeRows.length > 0;
  let theoreticalCostCents = 0;
  for (const r of recipeRows) {
    theoreticalCostCents +=
      (Number(r.recipe_qty) || 0) *
      (Number(item.quantity) || 0) *
      (Number(r.costo_unitario) || 0);
  }
  const theoreticalCostPesos = Math.round(theoreticalCostCents / 100);

  const costSnapshot = hasRecipe
    ? theoreticalCostPesos
    : (item.cost_snapshot != null ? Math.round(item.cost_snapshot) : null);

  const safeTotal = Number(item.total) || 0;
  const marginSnapshot =
    hasRecipe && theoreticalCostPesos > 0 && safeTotal > 0
      ? Math.round(((safeTotal - theoreticalCostPesos) / safeTotal) * 10000) / 100
      : item.margin_snapshot;

  await tx`
    INSERT INTO public.order_items (
      order_id, product_id, product_name,
      quantity, unit_price, total,
      cost_snapshot, margin_snapshot, pricing_tier_applied
    ) VALUES (
      ${orderId}, ${item.product_id}, ${item.product_name},
      ${item.quantity}, ${Math.round(item.unit_price)}, ${Math.round(safeTotal)},
      ${costSnapshot}, ${marginSnapshot}, ${item.pricing_tier_applied}
    )
  `;
}
```

Return changes to `{ id: orderId }` (no warnings). Response: `JSON.stringify({ id: result.id })`.

**2. `src/components/CreateOrderForm.tsx` — Lines 222-229**

Replace warnings block with simple success:
```ts
toast.success("¡Pedido creado!");
onSuccess();
```

**3. One-time SQL resync (migration)**

```sql
UPDATE products p
SET unit_cost = sub.cost_pesos
FROM (
  SELECT r.product_id, ROUND(SUM(r.quantity * i.costo_unitario) / 100.0) as cost_pesos
  FROM recipes r
  JOIN ingredients i ON i.id = r.ingredient_id
  GROUP BY r.product_id
) sub
WHERE p.id = sub.product_id
  AND (p.unit_cost IS NULL OR p.unit_cost = 0 OR p.unit_cost != sub.cost_pesos);
```

### Files

| Action | File |
|---|---|
| Edit | `supabase/functions/create-order/index.ts` — remove FIFO (~130 lines → ~30 lines), NaN-safe cost calc |
| Edit | `src/components/CreateOrderForm.tsx` — remove warnings handling |
| Migration | One-time product cost resync from recipes |

