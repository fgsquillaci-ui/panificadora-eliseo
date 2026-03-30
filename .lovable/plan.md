

## Fix Currency Formatting — Plan

### Root Cause

Line 18 of `OwnerDashboard.tsx`, line 13 of `Recipes.tsx`, and line 14 of `Ingredients.tsx` all define:
```typescript
const fmt = (cents: number) => `$${(cents / 100)...}`;
```
This divides all monetary values by 100. Since the DB stores whole pesos (e.g., 2000 = $2,000), all displayed values are 100x too small.

### Changes

**1. Create `src/utils/currency.ts`**

Shared formatter — no division:
```typescript
export const formatCurrency = (value: number) =>
  `$${value.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
```

**2. `src/pages/admin/OwnerDashboard.tsx`**

- Remove local `fmt` (line 18)
- Import `formatCurrency` from `@/utils/currency`
- Replace all `fmt(...)` calls with `formatCurrency(...)`

**3. `src/pages/admin/Recipes.tsx`**

- Remove local `fmt` (line 13)
- Import and use `formatCurrency`

**4. `src/pages/admin/Ingredients.tsx`**

- Remove local `fmt` (line 14)
- Import and use `formatCurrency` for all **display** calls (`fmt(costo_unitario)`, `fmt(unit_price)`, `fmt(total_cost)`, `fmt(weightedAvgCost)`)

### What is NOT changed

- The Ingredients form's `costo_unitario / 100` on edit load (line 32) and `* 100` on save (line 42) — these are paired data transformations, not display formatting. Changing one without the other would corrupt data. This should be addressed separately if needed.
- No backend, DB, or edge function changes
- No changes to Cart, ProductCatalog, OrderDetail (these already use `toLocaleString` directly without `/100`)
- Percentage/margin calculations are untouched

### Files

| File | Change |
|------|--------|
| `src/utils/currency.ts` | New shared formatter |
| `src/pages/admin/OwnerDashboard.tsx` | Replace `fmt` with `formatCurrency` |
| `src/pages/admin/Recipes.tsx` | Replace `fmt` with `formatCurrency` |
| `src/pages/admin/Ingredients.tsx` | Replace `fmt` with `formatCurrency` (display only) |

### Expected Result

- 1 Pan de ajo → $2,000 (not $20)
- 45 Pan de lomo → $31,500 (not $315)
- Ingredient costs display correctly
- Recipe costs display correctly

