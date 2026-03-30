

## Fix Cost Scaling — Normalize cost_snapshot (cents → pesos, no qty multiply)

### Changes

**1. `src/hooks/useProductProfitability.ts` (lines 97-101)**

Replace:
```typescript
const costSnap = item.cost_snapshot ?? 0;
if (costSnap > 0) {
  agg[pid].cost += costSnap * qty;
  agg[pid].hasCost = true;
}
```
With:
```typescript
const costSnap = item.cost_snapshot ?? 0;
if (costSnap > 0) {
  agg[pid].cost += costSnap / 100;
  agg[pid].hasCost = true;
}
```

Add validation after aggregation (before building result array): warn if `cost > revenue * 2`.

**2. `src/hooks/useFinancialData.ts` (lines 55-58)**

Replace:
```typescript
const costSnap = item.cost_snapshot ?? 0;
if (costSnap > 0) {
  totalCost += costSnap * qty;
}
```
With:
```typescript
const costSnap = item.cost_snapshot ?? 0;
if (costSnap > 0) {
  totalCost += costSnap / 100;
}
```

### What is NOT changed

- Revenue logic (already correct)
- Margin formula (already correct)
- `formatCurrency` utility
- DB, edge functions, order creation

### Files

| File | Change |
|------|--------|
| `src/hooks/useProductProfitability.ts` | `/100` instead of `* qty` for cost_snapshot |
| `src/hooks/useFinancialData.ts` | `/100` instead of `* qty` for cost_snapshot |

### Expected Result

- Costs display in pesos, proportional to revenue
- Margins become realistic (no -2000%)

