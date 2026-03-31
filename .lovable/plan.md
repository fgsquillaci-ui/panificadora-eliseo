

## Full Financial Normalization — Cents-to-Pesos Fix + Auto-Sync + Net Profit

### Root Problem

`costo_unitario`, `expenses.amount`, `cash_movements.amount`, and `purchases.unit_price/total_cost` are all stored in **cents**. After the global removal of `/100` from `formatCurrency`, all these values display 100x too high. Additionally, recipe changes don't auto-update `products.unit_cost`.

### Changes

**1. `src/hooks/useRecipes.ts` — Normalize costs + auto-sync unit_cost**

- `ingredient_cost` and `line_cost`: divide `costo_unitario` by 100 so values are in pesos
- `totalCost` becomes pesos automatically
- After `addLine`, `updateLine`, `removeLine`: recalculate total cost and update `products.unit_cost` via supabase update

```
line_cost: Number(r.quantity) * (r.ingredients?.costo_unitario || 0) / 100
```

After each mutation, sync:
```typescript
const syncUnitCost = async () => {
  const { data } = await supabase.from("recipes").select("quantity, ingredients(costo_unitario)").eq("product_id", productId);
  const cost = (data || []).reduce((s, r) => s + Number(r.quantity) * ((r as any).ingredients?.costo_unitario || 0) / 100, 0);
  await supabase.from("products").update({ unit_cost: Math.round(cost) } as any).eq("id", productId);
};
```

**2. `src/pages/admin/OwnerDashboard.tsx` — Fix expenses/cash storage + display**

- Lines 93, 105: **Remove `* 100`** when storing expenses and cash movements. Store in pesos directly (user enters pesos, save pesos).
- This fixes display since `fmt()` no longer divides.
- Existing data in cents will appear wrong — add a one-time migration to divide existing amounts by 100.

**3. `src/pages/admin/Ingredients.tsx` — Fix ingredient cost display**

- Lines 81-82, 128, 132, 182, 469: All display `costo_unitario`, `unit_price`, `total_cost` raw. These are in cents.
- Wrap with `/100` before `fmt()`: e.g., `fmt(i.costo_unitario / 100)`
- Lines 33, 43: Form already converts correctly (display /100, save *100) — keep as-is
- Purchase display (lines 128, 132): `fmt(p.unit_price / 100)`, `fmt(p.total_cost / 100)`

**4. `src/hooks/useFinancialData.ts` — Normalize expense/cash amounts for calculations**

- Expenses and cash amounts are in cents. When summing for financial calculations, divide by 100.
- `totalExpenses = items.reduce(...) / 100` or per-item `/100`
- Cash movement totals: same normalization

**5. `src/pages/admin/OwnerDashboard.tsx` — CostAnalysisSection display fix**

- Lines 469, 470: `fmt(r.costo_unitario / 100)`, `fmt(r.suggested / 100)`

**6. Database migration — Normalize existing expenses + cash_movements to pesos**

Convert existing cent-stored values to pesos so new entries (stored as pesos) are consistent:

```sql
UPDATE public.expenses SET amount = ROUND(amount / 100) WHERE amount > 0;
UPDATE public.cash_movements SET amount = ROUND(amount / 100) WHERE amount > 0;
```

After this migration, all new and old data is in pesos. Remove `/100` normalization from display code for these tables.

**7. Alternative: Keep cents in DB, normalize only at display**

To avoid a migration, we could keep cents and just add `/100` at every display point. But this is fragile and contradicts the PRD's "FULL currency, NOT cents" requirement. The migration approach is cleaner.

### Recommended Approach (Migration)

1. Migrate `expenses.amount` and `cash_movements.amount` to pesos (÷100)
2. Remove `* 100` from OwnerDashboard expense/cash insert code
3. Display these values directly with `fmt()`
4. For `ingredients.costo_unitario` and `purchases`: keep in cents (too many dependencies), normalize at display with `/100`
5. In `useRecipes`: normalize line costs `/100`, auto-sync `products.unit_cost`
6. Financial hooks: normalize expense/cash `/100` — wait, if we migrate then no normalization needed

Let me simplify: after migration, expenses and cash are in pesos. Ingredients stay in cents (displayed with `/100`).

### Final File Changes

| File | Change |
|------|--------|
| Migration | `expenses.amount /= 100`, `cash_movements.amount /= 100` |
| `src/hooks/useRecipes.ts` | Normalize `line_cost /100`, auto-sync `products.unit_cost` on mutations |
| `src/pages/admin/OwnerDashboard.tsx` | Remove `* 100` from expense/cash inserts; fix CostAnalysis display `/100` |
| `src/pages/admin/Ingredients.tsx` | Display `costo_unitario / 100`, `unit_price / 100`, `total_cost / 100` |
| `src/hooks/useFinancialData.ts` | Remove `/100` normalization for expenses (now in pesos after migration) |

### Unchanged

- DB schema structure (no new tables needed — expenses already exists with types)
- Order creation flow
- `useProductProfitability.ts` (already correct)
- Pricing logic
- Delivery

### Expected Result

- Recipe costs display correctly (e.g., $5,148 not $514,800)
- Recipe changes auto-update `products.unit_cost`
- Expenses display correctly (e.g., $500 not $50,000)
- Cash movements display correctly
- Ingredient costs display correctly
- Net profit = revenue - product_cost - expenses (already calculated, just values were wrong)
- Pricing panel margins become accurate

