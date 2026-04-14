

## Fix: Unify purchase history using `ingredient_batches`

### Current State
- The `purchases` table is **empty** — no historical migration needed
- All purchase data (including from expenses) already lives in `ingredient_batches`
- But `usePurchases.ts` still reads from `purchases`, so "Historial de compras" shows empty and "Costo promedio" shows "Sin compras"

### Changes

**1. `src/hooks/usePurchases.ts`** — Switch to `ingredient_batches`

- **fetchPurchases**: Query `ingredient_batches` instead of `purchases`, mapping fields:
  - `quantity_total` → `quantity`
  - `unit_cost` → `unit_price` (already in pesos)
  - `purchase_date` → `date`
  - `quantity_total * unit_cost` → `total_cost`
- **Realtime**: Listen on `ingredient_batches` table instead of `purchases`
- **create**: Stop writing to `purchases` table entirely. Only write to `ingredient_batches` (already does this). Keep `cascadeResync` and cost history logging.
- **remove**: Delete from `ingredient_batches` instead of `purchases`, then call `cascadeResync` to update stock/cost
- **weightedAvgCost**: Calculate from batch data (values already in pesos, no `/100` needed)

**2. `src/pages/admin/Ingredients.tsx`** — Fix display formatting

- Purchase history display: remove `/100` division since `unit_cost` from batches is already in pesos
- Show `supplier` from batch data
- `total_cost` display: also already in pesos, remove `/100`

### No database changes needed
- `purchases` table is already empty — no migration required
- `ingredient_batches` is already the single source of truth

### Impact
- "Historial de compras" will show all entries (from both direct purchases and expenses)
- "Costo promedio (compras)" will calculate correctly
- No data loss — `purchases` table left as-is (deprecated)

