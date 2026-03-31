

## Unified Financial System — `products.unit_cost` as SSOT

### Summary

Add `unit_cost` column to products table, then replace all `cost_snapshot`-based calculations with `products.unit_cost * quantity`. Remove legacy cost logic from all hooks and the dashboard.

### Database Change

**Migration**: Add `unit_cost` integer column to `products` table (nullable, default null). Then populate it from existing recipe data:

```sql
ALTER TABLE public.products ADD COLUMN unit_cost integer DEFAULT NULL;

-- Populate from recipes × ingredients (costo_unitario is in cents, so /100 for pesos)
UPDATE public.products p
SET unit_cost = sub.total_cost
FROM (
  SELECT r.product_id, ROUND(SUM(r.quantity * i.costo_unitario / 100.0))::integer AS total_cost
  FROM recipes r
  JOIN ingredients i ON i.id = r.ingredient_id
  GROUP BY r.product_id
) sub
WHERE p.id = sub.product_id;
```

### Code Changes

**1. `src/hooks/useProductProfitability.ts`**

- Fetch `products` with `unit_cost` alongside prices
- Replace `cost_snapshot / 100` with `product.unit_cost * qty`
- Cost logic becomes:
  ```
  const unitCost = productMap[pid]?.unit_cost ?? 0;
  agg[pid].cost += unitCost * qty;
  agg[pid].hasCost = unitCost > 0;
  ```
- Remove `cost_snapshot` from the query select
- Keep price deviation logic (uses products table prices — already correct)

**2. `src/hooks/useFinancialData.ts`**

- Join `order_items` with product data to get `unit_cost`
- Replace `costSnap / 100` with `product.unit_cost * qty`
- Alternative: fetch products once, build map, iterate items

**3. `src/pages/admin/OwnerDashboard.tsx`**

- **Pricing panel** (lines 42-72): Replace recipe-based cost calculation with `products.unit_cost` from the query. Remove the manual `costMap` from recipes. The query already fetches products — just use `unit_cost` directly.
- Remove `useIngredients` import if no longer needed for cost (still needed for CostAnalysisSection)
- Pricing panel cost = `p.unit_cost ?? 0` (already in pesos, no division needed)

**4. `src/utils/currency.ts`** — No change (already correct, no `/100`)

### What is NOT changed

- DB schema for `order_items` (cost_snapshot column stays, just unused in calculations)
- Edge function / order creation (still writes cost_snapshot for historical record)
- Recipe system, ingredient management
- Delivery logic
- `formatCurrency` utility

### Keeping `unit_cost` in sync

When ingredients or recipes change, `unit_cost` must be updated. Two options:

- **Option A**: Update `unit_cost` on the fly when the pricing panel loads (current behavior, just write the result to products)
- **Option B**: Add a DB trigger on recipes/ingredients changes

Recommendation: Option A — update `unit_cost` when recipe cost is recalculated in the pricing panel or via a "sync costs" button. This avoids complex triggers and keeps the flow explicit.

### Expected Result

- Cost = `unit_cost × quantity` everywhere
- No `cost_snapshot` in any financial calculation
- Pricing panel uses `products.unit_cost` directly
- Margins become accurate and consistent across all views
- Products without recipes show "Sin costo"

### Files

| File | Change |
|------|--------|
| Migration | Add `unit_cost` column + populate from recipes |
| `src/hooks/useProductProfitability.ts` | Use `products.unit_cost` instead of `cost_snapshot` |
| `src/hooks/useFinancialData.ts` | Use `products.unit_cost` instead of `cost_snapshot` |
| `src/pages/admin/OwnerDashboard.tsx` | Remove recipe cost calc, use `unit_cost` from products query |

