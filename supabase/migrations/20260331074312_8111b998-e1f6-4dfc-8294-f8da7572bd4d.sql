
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'efectivo';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS supplier text DEFAULT '';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS ingredient_id uuid DEFAULT NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS batch_id uuid DEFAULT NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'otros';
UPDATE public.expenses SET category = type;
