-- Fix delivery RLS on orders
DROP POLICY IF EXISTS "Delivery can read assigned orders" ON public.orders;
CREATE POLICY "Delivery can read assigned orders"
  ON public.orders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliveries d
      WHERE d.order_id = orders.id
        AND d.delivery_user_id = auth.uid()
    )
  );

-- Fix delivery RLS on order_items
DROP POLICY IF EXISTS "Delivery can read assigned order_items" ON public.order_items;
CREATE POLICY "Delivery can read assigned order_items"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM deliveries d
      WHERE d.order_id = order_items.order_id
        AND d.delivery_user_id = auth.uid()
    )
  );