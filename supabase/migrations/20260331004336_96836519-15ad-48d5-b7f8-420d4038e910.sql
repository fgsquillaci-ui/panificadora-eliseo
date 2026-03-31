ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit_cost integer DEFAULT NULL;

UPDATE public.products p
SET unit_cost = sub.total_cost
FROM (
  SELECT r.product_id, ROUND(SUM(r.quantity * i.costo_unitario / 100.0))::integer AS total_cost
  FROM recipes r
  JOIN ingredients i ON i.id = r.ingredient_id
  GROUP BY r.product_id
) sub
WHERE p.id = sub.product_id;