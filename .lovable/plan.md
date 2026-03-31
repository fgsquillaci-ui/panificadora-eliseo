

## Financial System Hardening — Final Corrections

### 1. Add `FOR UPDATE` to FIFO batch query in `create-order/index.ts` (line 167)

The batch SELECT is already inside `sql.begin()`. Add `FOR UPDATE` to lock rows during consumption:

```sql
SELECT id, quantity_remaining, unit_cost
FROM public.ingredient_batches
WHERE ingredient_id = ${recipe.ingredient_id} AND quantity_remaining > 0
ORDER BY purchase_date ASC, created_at ASC, id ASC
FOR UPDATE
```

### 2. Make `manage-expense` truly atomic with `postgresjs`

Current implementation uses Supabase client (sequential, non-atomic). Rewrite to use `postgresjs` with `sql.begin()` — same pattern as `create-order`. All steps (expense insert/update/delete, batch insert/delete, `batch_id` link, cascadeResync) execute inside a single `BEGIN/COMMIT/ROLLBACK`.

### 3. Clarify `cost_snapshot` semantics

Looking at `create-order` line 178: `itemCostPesos += consume * unit_cost` accumulates across all recipe ingredients for all units. This is the **total line cost** (not per-unit). This is correct — `cost_snapshot` = total cost for the full order item line.

In `useProductProfitability.ts`, cost is currently calculated as `unit_cost * qty` (line 99) from `products.unit_cost`. This is the **estimated** cost approach. The plan adds a **real cost** path using `cost_snapshot` directly (no multiplication).

### 4. Add `realCost` and `realProfit` to `useFinancialData.ts`

```typescript
let totalRealCost = 0;
items.forEach((item) => {
  const costSnap = item.cost_snapshot ?? 0;
  if (costSnap > 0) totalRealCost += costSnap;
  // Validation: warn on null cost_snapshot for delivered items
  if (costSnap === null || costSnap === 0) {
    console.warn("Delivered order item missing cost_snapshot", item);
  }
});
```

Expose: `realCost`, `realProfit = revenue - realCost - expenses`

### 5. Update `OwnerDashboard.tsx` KPIs

- Rename "Ganancia" to "Ganancia estimada" with tooltip: "Proyección basada en costo actual de recetas"
- Add "Ganancia real" KPI: `revenue - realCost - expenses` with tooltip: "Basada en costo histórico real (FIFO) de cada pedido"
- Keep existing margin as estimated

### 6. Zero-stock recipe protection in `useRecipes.ts`

If **any** ingredient in a recipe has `stock_actual === 0`:
- Set `totalCost` to `null` (not partial calculation)
- Add `hasZeroStock: true` flag to the hook return
- UI shows badge "Sin stock — costo no confiable"
- Pricing panel skips margin/suggestion for products with `hasZeroStock`

### 7. Validation logging

Add `console.warn` in:
- `useExpenses.ts` fetch: if `category === "materia_prima" && !batch_id`
- `useFinancialData.ts`: if `cost_snapshot` is null/0 on delivered items (see above)
- `useRecipes.ts` fetch: if `ingredient.stock_actual < 0`

---

### Files Summary

| File | Change |
|------|--------|
| `supabase/functions/create-order/index.ts` | Add `FOR UPDATE` to batch SELECT (line 167) |
| `supabase/functions/manage-expense/index.ts` | Rewrite with `postgresjs` transactions |
| `src/hooks/useFinancialData.ts` | Add `realCost`, `realProfit`, validation logging |
| `src/pages/admin/OwnerDashboard.tsx` | Add "Ganancia real" KPI, tooltips, skip zero-stock in pricing |
| `src/hooks/useRecipes.ts` | Null cost if any ingredient has zero stock, `hasZeroStock` flag |
| `src/hooks/useExpenses.ts` | Orphan expense logging on fetch |

### Unchanged
- Database schema (no migrations)
- Revenue logic
- `useProductProfitability.ts` (estimated cost path stays)
- Historical data

