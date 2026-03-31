-- 1. Create ingredient_batches table
CREATE TABLE public.ingredient_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity_total numeric NOT NULL,
  quantity_remaining numeric NOT NULL,
  unit_cost numeric NOT NULL,
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