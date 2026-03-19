
-- 1. RLS policy: delivery can read order_items for en_delivery/entregado orders
CREATE POLICY "Delivery can read order_items for delivery orders"
ON public.order_items
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'delivery'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
    AND o.status IN ('en_delivery'::order_status, 'entregado'::order_status)
  )
);

-- 2. RLS policy: delivery can also read entregado orders
CREATE POLICY "Delivery can read entregado orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'delivery'::app_role)
  AND status = 'entregado'::order_status
);

-- 3. Re-create updated_at trigger
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
