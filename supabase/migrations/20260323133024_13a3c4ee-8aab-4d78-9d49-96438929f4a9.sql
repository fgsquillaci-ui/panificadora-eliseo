
-- order_history table
CREATE TABLE public.order_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  old_value text,
  new_value text,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order_history"
  ON public.order_history FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own order_history"
  ON public.order_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- error_logs table
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage error_logs"
  ON public.error_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can insert error_logs"
  ON public.error_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Realtime for order_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_history;

-- Trigger: auto-log status changes on orders
CREATE OR REPLACE FUNCTION public.log_order_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_history (order_id, action, old_value, new_value, user_id)
    VALUES (NEW.id, 'status_change', OLD.status::text, NEW.status::text, COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_order_status_change
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();
