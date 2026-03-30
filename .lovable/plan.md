

## Fix Pricing Panel Cost — Normalize Recipe Cost

### Problem

The pricing panel (lines 42-72) calculates cost directly from `recipes × ingredients.costo_unitario`. Since `costo_unitario` is stored in **cents**, the cost is 100x too high after the global `/100` removal from `fmt`. This causes inflated costs, negative margins, and unusable suggested prices.

### Solution

Normalize the recipe-based cost in the pricing panel by dividing by 100, matching the same normalization applied in `useProductProfitability`.

### Change

**`src/pages/admin/OwnerDashboard.tsx` (line 49)**

Replace:
```typescript
costMap[r.product_id] = (costMap[r.product_id] || 0) + Number(r.quantity) * (r.ingredients?.costo_unitario || 0);
```
With:
```typescript
costMap[r.product_id] = (costMap[r.product_id] || 0) + (Number(r.quantity) * (r.ingredients?.costo_unitario || 0)) / 100;
```

### Why not replace with hook data

The pricing panel intentionally uses **live recipe costs** (current ingredient prices) rather than historical `cost_snapshot` from orders. This is correct for pricing decisions — you want to know what a product costs **now**, not what it cost when last sold. The hook uses snapshots for financial reporting; the pricing panel uses live data for price strategy. These are different use cases and should remain separate.

### Files

| File | Change |
|------|--------|
| `src/pages/admin/OwnerDashboard.tsx` | Add `/100` to recipe cost normalization (line 49) |

### Unchanged

- `useProductProfitability.ts` (already correct)
- `useFinancialData.ts` (already correct)
- Revenue, margin formulas, DB, edge functions

### Expected Result

- Pricing panel costs match real values (e.g., cost $514 not $51,400)
- Margins become realistic and positive
- Suggested prices become usable

