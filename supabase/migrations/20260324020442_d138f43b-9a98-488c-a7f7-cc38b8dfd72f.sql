
ALTER TABLE public.customers ADD COLUMN price_type text NOT NULL DEFAULT 'minorista';

ALTER TABLE public.orders ADD COLUMN payment_method text NOT NULL DEFAULT 'efectivo';

ALTER TABLE public.products ADD COLUMN intermediate_price integer;
