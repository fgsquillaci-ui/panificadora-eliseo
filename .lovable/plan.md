

## Fix: Recipe costs not reflected in financial page

### Root cause

When a recipe is created/updated for a product, `products.unit_cost` is correctly synced. However, **existing delivered orders** still have `cost_snapshot = NULL` in `order_items` because cost was only calculated at order creation time (before the recipe existed). The financial dashboard only reads `cost_snapshot` for cost calculations, so it shows $0 cost for those items.

### Solution: Two-part fix

**1. Backfill `cost_snapshot` when a recipe is saved**

In `src/hooks/useRecipes.ts`, after `syncProductUnitCost` runs, call a new function `backfillMissingCostSnapshots` that:
- Finds all `order_items` where `product_id` matches and `cost_snapshot IS NULL`
- Calculates cost from the current recipe (same formula as `create-order`)
- Updates those rows with the computed cost and margin

This requires a new edge function (since `order_items` has no UPDATE RLS for regular users) or a database function with SECURITY DEFINER.

**2. Add a database function `backfill_cost_snapshots`**

Create a SECURITY DEFINER function that:
- Takes a `product_id` parameter
- Reads the current recipe cost for that product
- Updates all `order_items` with `cost_snapshot IS NULL` for that product
- Calculates and sets `margin_snapshot` as well

### Technical details

**Database migration** — New function:
```sql
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
  -- Get current unit_cost from products (already synced by recipe save)
  SELECT unit_cost INTO _unit_cost FROM products WHERE id = _product_id;
  
  IF _unit_cost IS NULL OR _unit_cost = 0 THEN
    RETURN 0;
  END IF;

  -- Update order_items missing cost_snapshot
  UPDATE order_items oi
  SET 
    cost_snapshot = _unit_cost * oi.quantity,
    margin_snapshot = CASE 
      WHEN oi.total > 0 THEN ROUND(((oi.total - (_unit_cost * oi.quantity))::numeric / oi.total) * 10000) / 100
      ELSE 0 
    END
  WHERE oi.product_id = _product_id
    AND oi.cost_snapshot IS NULL;

  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated;
END;
$$;
```

**`src/hooks/useRecipes.ts`** — After `syncProductUnitCost`, call the backfill:
```typescript
// After syncProductUnitCost(productId):
await supabase.rpc('backfill_cost_snapshots', { _product_id: productId });
```

Add this call in `addLine`, `updateLine`, and `removeLine` functions.

### Files

| Action | Target |
|---|---|
| DB Migration | New function `backfill_cost_snapshots` |
| Edit | `src/hooks/useRecipes.ts` — call backfill after recipe sync (3 lines added) |

### What does NOT change
- `create-order` edge function (already calculates cost correctly for new orders)
- `useFinancialData` / `useProductProfitability` (they already read `cost_snapshot` correctly)
- No impact on orders that already have `cost_snapshot` set

