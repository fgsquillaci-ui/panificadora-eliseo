CREATE OR REPLACE FUNCTION public.backfill_cost_snapshots(_product_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _unit_cost numeric;
  _updated integer;
BEGIN
  SELECT unit_cost INTO _unit_cost FROM products WHERE id = _product_id;
  
  IF _unit_cost IS NULL OR _unit_cost = 0 THEN
    RETURN 0;
  END IF;

  UPDATE order_items oi
  SET 
    cost_snapshot = _unit_cost * oi.quantity,
    margin_snapshot = CASE 
      WHEN oi.total > 0 THEN ROUND(((oi.total - (_unit_cost * oi.quantity))::numeric / oi.total) * 10000) / 100
      ELSE 0 
    END
  WHERE oi.product_id = _product_id
    AND (oi.cost_snapshot IS NULL OR oi.cost_snapshot = 0);

  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated;
END;
$$;