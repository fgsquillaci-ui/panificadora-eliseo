

## Financial Refactor — Final Corrected Plan

### Verification of Current Code

| Rule | `useFinancialData` | `useProductProfitability` | Status |
|------|---|---|---|
| Filter `entregado` | `.eq("orders.status", "entregado")` | `.eq("orders.status", "entregado")` | ✅ |
| Revenue null safety | `item.total && item.total > 0 ? item.total : (unit_price ?? 0) * qty` | Same | ✅ |
| Cost null safety | `(cost_snapshot ?? 0) * qty` | Same | ✅ |
| Identical query structure | `order_items` + `orders!inner(status, created_at)` | Same | ✅ |
| Margin safety | `revenue > 0` check | `revenue > 0 && hasCost` check, returns `null` | ✅ |
| No products/recipes for financials | Correct | Correct | ✅ |

### What still needs implementation

Both hooks lack `tierFilter` and `unitPrice` from the approved plan. The pricing panel still uses `products.retail_price`.

### Changes

**1. `src/hooks/useProductProfitability.ts`**

- Add `tierFilter` parameter: `"minorista" | "intermedio" | "mayorista" | null`
- Add `product_id` and `pricing_tier_applied` to select
- Apply tier filter at query level: `if (tierFilter) query = query.eq("pricing_tier_applied", tierFilter)`
- Aggregate by `product_id` (not `product_name`)
- Add `unitPrice: number | null` — calculated as `units > 0 ? revenue / units : null`
- Add `product_id` to `ProductProfit` interface
- If `units === 0`: revenue = 0, unitPrice = null, margin = null

**2. `src/hooks/useFinancialData.ts`**

- Add `tierFilter` parameter (same type)
- Add `pricing_tier_applied` to select
- Apply tier filter at query level: `if (tierFilter) query = query.eq("pricing_tier_applied", tierFilter)`
- No other changes needed — revenue/cost logic is already correct

**3. `src/pages/admin/OwnerDashboard.tsx`**

- Add `tierFilter` state + "Tipo de venta" dropdown (Todos / Minorista / Intermedio / Mayorista)
- Pass `tierFilter` to both hooks
- Add "Precio promedio" column to profitability table showing `unitPrice`
- In pricing panel: replace `products.retail_price` ("Precio actual") with real `unitPrice` from profitability data, matched by `product_id`

**4. `.lovable/plan.md`** — Update with final corrections

### Interface

```typescript
export interface ProductProfit {
  product_id: string;
  product_name: string;
  units_sold: number;
  revenue: number;
  cost: number;
  margin: number | null;
  unitPrice: number | null;
  hasRecipe: boolean;
}
```

### Files

| File | Change |
|------|--------|
| `src/hooks/useFinancialData.ts` | Add `tierFilter` at query level |
| `src/hooks/useProductProfitability.ts` | Add `tierFilter`, `product_id`, `unitPrice`, aggregate by `product_id` |
| `src/pages/admin/OwnerDashboard.tsx` | Tier dropdown, unitPrice column, replace `products.retail_price` |
| `.lovable/plan.md` | Update with final plan |

### Unchanged

- Edge function, CreateOrderForm, pricing logic, recipes, ingredients, DB schema, delivery

