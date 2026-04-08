ALTER TABLE public.recurring_expenses
ADD COLUMN IF NOT EXISTS estimated boolean DEFAULT false;

ALTER TABLE public.recurring_expenses
ADD CONSTRAINT valid_estimated_amount
CHECK (NOT (estimated = true AND amount IS NULL));