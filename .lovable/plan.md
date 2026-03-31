

## FIFO Inventory System — Final Implementation Plan

### Database Migration

```sql
-- 1. Create ingredient_batches table
CREATE TABLE public.ingredient_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_total numeric NOT NULL,
  quantity_remaining numeric NOT NULL,
  unit_cost numeric NOT NULL,  -- FULL PESOS
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  supplier text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT positive_quantity CHECK (quantity_total > 0),
  CONSTRAINT non_negative_remaining CHECK (quantity_remaining >= 0),
  CONSTRAINT positive_cost CHECK (unit_cost > 0),
  CONSTRAINT remaining_lte_total CHECK (quantity_remaining <= quantity_total)
);

-- 2. RLS
ALTER TABLE public.ingredient_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage batches" ON public.ingredient_batches
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Performance index for FIFO queries
CREATE INDEX idx_batches_fifo ON public.ingredient_batches (ingredient_id, purchase_date ASC, created_at ASC);

-- 4. Convert products.unit_cost to numeric
ALTER TABLE public.products ALTER COLUMN unit_cost TYPE numeric;

-- 5. Convert order_items.cost_snapshot to numeric pesos (NO rounding)
ALTER TABLE public.order_items ALTER COLUMN cost_snapshot TYPE numeric;
UPDATE public.order_items SET cost_snapshot = cost_snapshot / 100.0 WHERE cost_snapshot > 0;

-- 6. Seed legacy batches (including zero-cost ingredients with stock)
INSERT INTO public.ingredient_batches (ingredient_id, quantity_total, quantity_remaining, unit_cost, purchase_date, supplier)
SELECT id, stock_actual, stock_actual,
  CASE WHEN costo_unitario > 0 THEN costo_unitario / 100.0 ELSE 0.01 END,
  CURRENT_DATE, 'Stock inicial'
FROM public.ingredients WHERE stock_actual > 0;

-- 7. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredient_batches;
```

Key safeguards in migration:
- `quantity_remaining = quantity_total` enforced by seeding with same value
- `CHECK (quantity_remaining <= quantity_total)` constraint
- `CHECK (quantity_remaining >= 0)` prevents negative values
- Composite index `(ingredient_id, purchase_date, created_at)` for FIFO performance
- Zero-cost ingredients seeded with `0.01` to satisfy `positive_cost` constraint

---

### New File: `src/hooks/useBatches.ts`

- Fetch batches: `ORDER BY purchase_date ASC, created_at ASC, id ASC`
- `consumeFIFO(ingredientId, neededQty)`:
  - Uses `MIN(batch.quantity_remaining, remaining)` — never produces negatives
  - Throws error if `remaining > 0` after all batches exhausted
  - Returns total cost in pesos
- Cascade resync after consumption:
  1. `ingredients.stock_actual = SUM(quantity_remaining)`
  2. `ingredients.costo_unitario` = weighted avg × 100
  3. Find affected products via `recipes` → recalc `products.unit_cost`

---

### Modified: `src/hooks/usePurchases.ts`

- On `create()`: insert batch with `quantity_remaining = quantity_total` (same value), `unit_cost` in pesos
- Cascade resync: stock, costo_unitario, then only affected products via recipes

---

### Modified: `src/hooks/useRecipes.ts`

- If `ingredient.stock_actual == 0`: show warning "Sin stock — costo no representativo"
- `syncProductUnitCost` unchanged

---

### Modified: `src/hooks/useProductProfitability.ts`

- Remove `/100` from `cost_snapshot` (now in pesos after migration)

---

### Modified: `supabase/functions/create-order/index.ts`

- FIFO consumption per recipe ingredient within transaction
- `MIN(batch.quantity_remaining, remaining)` — safe deduction
- Save `cost_snapshot` in pesos (no scaling)
- Rollback on insufficient stock with error details
- After consumption: sync stock + costs for affected ingredients/products

---

### Modified: `src/pages/admin/Ingredients.tsx`

- "Lotes" section showing batches with `quantity_remaining > 0`
- Price variation alert (>20% between batches)

---

### Currency After Migration

| Field | Unit | Normalization |
|-------|------|---------------|
| `ingredient_batches.unit_cost` | Pesos | None |
| `ingredients.costo_unitario` | Cents | `/100` at display |
| `products.unit_cost` | Pesos | None |
| `order_items.cost_snapshot` | Pesos | None |

---

### Files

| File | Change |
|------|--------|
| Migration | Create table, constraints, index, alter columns, seed batches |
| `src/hooks/useBatches.ts` | New: FIFO consume, batch fetch, cascade resync |
| `src/hooks/usePurchases.ts` | Create batch on purchase, cascade resync |
| `src/hooks/useRecipes.ts` | Zero-stock warning |
| `src/hooks/useProductProfitability.ts` | Remove `/100` from cost_snapshot |
| `src/pages/admin/Ingredients.tsx` | Batch list UI, price variation alert |
| `supabase/functions/create-order/index.ts` | FIFO consumption + snapshot + rollback |

