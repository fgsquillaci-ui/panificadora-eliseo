ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_date date;
UPDATE public.orders SET delivery_date = created_at::date WHERE delivery_date IS NULL;
ALTER TABLE public.orders ALTER COLUMN delivery_date SET DEFAULT CURRENT_DATE;