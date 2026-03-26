
-- 1. Cost history table
CREATE TABLE public.raw_material_cost_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  old_cost integer NOT NULL DEFAULT 0,
  new_cost integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.raw_material_cost_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cost_history"
  ON public.raw_material_cost_history FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Products: target_margin and last_cost_sync_at
ALTER TABLE public.products ADD COLUMN target_margin numeric DEFAULT 30;
ALTER TABLE public.products ADD COLUMN last_cost_sync_at timestamptz;

-- 3. Order items: snapshots
ALTER TABLE public.order_items ADD COLUMN cost_snapshot integer DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN margin_snapshot numeric DEFAULT 0;
ALTER TABLE public.order_items ADD COLUMN product_id uuid;

-- 4. Orders: payment status
ALTER TABLE public.orders ADD COLUMN payment_status text NOT NULL DEFAULT 'no_cobrado';
