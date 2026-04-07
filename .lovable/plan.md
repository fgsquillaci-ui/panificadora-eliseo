

## Add `delivery_date` to create-order (safe implementation)

### Changes

**1. Migration — Add `delivery_date` column**

```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_date date;
UPDATE public.orders SET delivery_date = created_at::date WHERE delivery_date IS NULL;
ALTER TABLE public.orders ALTER COLUMN delivery_date SET DEFAULT CURRENT_DATE;
```

**2. `supabase/functions/create-order/index.ts`**

- **Line 32**: Add `delivery_date?: string;` to `OrderPayload` interface
- **Line 127** (before transaction): Add safe date extraction:
  ```ts
  const deliveryDate =
    body.delivery_date && !isNaN(Date.parse(body.delivery_date))
      ? new Date(body.delivery_date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
  ```
- **Lines 130-141**: Update INSERT to include `delivery_date` column and `${deliveryDate}` value

No other logic is modified — cost calculation, margin, items, and transaction flow remain untouched.

### Files

| Action | File |
|---|---|
| Migration | Add `delivery_date` column, backfill from `created_at`, set default |
| Edit | `supabase/functions/create-order/index.ts` — interface + extraction + INSERT |

