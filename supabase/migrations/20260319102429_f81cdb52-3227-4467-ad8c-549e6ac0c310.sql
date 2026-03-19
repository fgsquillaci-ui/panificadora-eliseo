
-- Add new columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reseller_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_by text NOT NULL DEFAULT 'admin';

-- Add new enum values
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'listo';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'en_delivery';
