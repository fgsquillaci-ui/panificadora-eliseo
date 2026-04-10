

## Fix: Exclude pickup orders from delivery dashboard

### Problem
Delivery dashboard filters by status but not by `delivery_type`, so pickup orders appear for delivery users.

### Changes

**1. `src/hooks/useRealtimeOrders.ts`** — Add `deliveryTypeFilter` option

- Add `deliveryTypeFilter?: string` to `UseRealtimeOrdersOptions`
- In `fetchOrders`: add `.eq("delivery_type", value)` when set
- In realtime INSERT handler: skip if `deliveryTypeFilter` is set and `payload.new.delivery_type` doesn't match
- In realtime UPDATE handler: same filter logic
- Add to channel name and effect dependency array

**2. `src/pages/delivery/Dashboard.tsx`** — Pass filter

- Both `useRealtimeOrders` calls add `deliveryTypeFilter: "delivery"`

### Scope
- Admin/owner views unaffected (they don't pass this filter)
- Null or non-matching `delivery_type` orders excluded from delivery dashboard (safe fallback)
- No database changes needed

