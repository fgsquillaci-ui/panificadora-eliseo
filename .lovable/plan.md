

## Financial Refactor — Corrected Plan

### Changes

**1. `src/hooks/useFinancialData.ts`** — Revenue + cost from order_items

Replace `orders.total` approach. Single query: `order_items` with nested `orders(status, created_at)`, filter `status = entregado`, period filter on `created_at`.

- `revenue = SUM(item.total > 0 ? item.total : (item.unit_price ?? 0) * (item.quantity ?? 0))`
- `estimatedCost = SUM((item.cost_snapshot ?? 0) * (item.quantity ?? 0))` where cost_snapshot > 0
- Export new `estimatedCost` field
- Remove `orders.total` query for revenue

**2. `src/hooks/useProductProfitability.ts`** — Pure snapshot, no recipes

Remove entirely:
- Recipe query, `costMap`, `recipeProducts`
- `hasLegacyData` field from interface

New logic per product:
- `revenue = SUM(item.total > 0 ? item.total : (unit_price ?? 0) * (quantity ?? 0))`
- `cost = SUM((cost_snapshot ?? 0) * (quantity ?? 0))` where `cost_snapshot > 0`
- `hasRecipe = true` if any item for that product has `cost_snapshot > 0`
- `margin = revenue > 0 && hasRecipe ? ((revenue - cost) / revenue) * 100 : null`

Single query approach: `order_items` select with `orders!inner(status, created_at)`, filter `orders.status = entregado` and `orders.created_at >= periodStart`.

**3. `src/pages/admin/OwnerDashboard.tsx`** — UI cleanup

- Remove `hasLegacyData` tooltip/icon references
- Remove `Info` import
- Margin display: `margin === null` → "No calculable", else badge with percentage
- Cost display: `!hasRecipe` → "Sin costo"

### Interface

```typescript
export interface ProductProfit {
  product_name: string;
  units_sold: number;
  revenue: number;
  cost: number;
  margin: number | null;
  hasRecipe: boolean;
}
```

### Files

| File | Change |
|------|--------|
| `src/hooks/useFinancialData.ts` | Revenue + estimatedCost from order_items, single query |
| `src/hooks/useProductProfitability.ts` | Remove recipe fallback, pure snapshot, margin as null |
| `src/pages/admin/OwnerDashboard.tsx` | Remove legacy indicators, null margin display |

### Unchanged

- Edge function, CreateOrderForm, pricing, recipes, ingredients, delivery, DB schema

