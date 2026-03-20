
-- Extend customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS created_by text NOT NULL DEFAULT 'admin';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS reseller_id uuid;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Drop old customer_type column (replaced by reseller_id)
ALTER TABLE public.customers DROP COLUMN IF EXISTS customer_type;

-- Add customer_id to orders (optional FK)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id);

-- Enable realtime for customers
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;

-- Drop old public read policy
DROP POLICY IF EXISTS "Public read access on customers" ON public.customers;

-- RLS: Admins full access
CREATE POLICY "Admins can manage all customers"
ON public.customers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: Revendedores can read own customers
CREATE POLICY "Resellers can read own customers"
ON public.customers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'revendedor') AND reseller_id = auth.uid());

-- RLS: Revendedores can insert own customers
CREATE POLICY "Resellers can insert own customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'revendedor') AND reseller_id = auth.uid());

-- RLS: Revendedores can update own customers
CREATE POLICY "Resellers can update own customers"
ON public.customers FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'revendedor') AND reseller_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'revendedor') AND reseller_id = auth.uid());
