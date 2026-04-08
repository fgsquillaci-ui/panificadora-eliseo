CREATE TABLE public.recurring_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount numeric,
  frequency text NOT NULL DEFAULT 'monthly',
  day_of_month integer,
  day_of_week integer,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  active boolean DEFAULT true,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT valid_frequency CHECK (frequency IN ('monthly', 'weekly')),
  CONSTRAINT valid_day_config CHECK (
    (frequency = 'monthly' AND day_of_month IS NOT NULL AND day_of_week IS NULL) OR
    (frequency = 'weekly' AND day_of_week IS NOT NULL AND day_of_month IS NULL)
  )
);

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage recurring_expenses"
  ON public.recurring_expenses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));