
-- 1. Add updated_at column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 5. RLS: Delivery can read all orders with status en_delivery
CREATE POLICY "Delivery can read en_delivery orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'delivery') AND status = 'en_delivery'
  );

-- 6. RLS: Delivery can update orders from en_delivery to entregado
CREATE POLICY "Delivery can mark orders as entregado"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'delivery') AND status = 'en_delivery'
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'delivery') AND status = 'entregado'
  );
