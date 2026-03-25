
-- 1. Add staff_status to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_status text NOT NULL DEFAULT 'activo';

-- 2. Create purchases table
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0,
  unit_price integer NOT NULL DEFAULT 0,
  total_cost integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. RLS for purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage purchases"
ON public.purchases FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Enable realtime for purchases
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;

-- 5. Update handle_new_user trigger to also create customer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_customer_id uuid;
BEGIN
  -- Create customer record
  INSERT INTO public.customers (name, phone, created_by)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), NULL),
    'registro'
  )
  RETURNING id INTO new_customer_id;

  -- Create profile linked to customer
  INSERT INTO public.profiles (id, name, phone, customer_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), NULL),
    new_customer_id
  );

  RETURN NEW;
END;
$$;
