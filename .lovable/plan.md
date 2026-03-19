

## Plan: Fix critical sync, RLS, and realtime bugs

### Root causes identified

1. **Delivery can't see order items**: The `order_items` RLS only allows reading via `deliveries` table join or `user_id` match. Delivery users querying `order_items` directly get empty results because there's no policy for delivery role reading order_items of `en_delivery` orders.

2. **Realtime channel collision**: All `useRealtimeOrders` instances use the same channel name `"orders-realtime"`. When Delivery dashboard creates two instances (one for `en_delivery`, one for `entregado`), the second subscription overwrites the first.

3. **No trigger attached**: The `db-triggers` section shows "There are no triggers in the database" — the `updated_at` trigger may not have been applied, or the migration failed silently.

### Changes

#### 1. SQL Migration

- **Add RLS policy on `order_items`** for delivery role: delivery users can SELECT order_items where the parent order has `status = 'en_delivery'` OR `status = 'entregado'`
- **Re-create the `updated_at` trigger** on orders if missing (idempotent `CREATE OR REPLACE` + `DROP TRIGGER IF EXISTS`)
- **Verify realtime publication** is enabled

#### 2. Fix `useRealtimeOrders.ts` — unique channel names

Change channel name from hardcoded `"orders-realtime"` to a unique name per hook instance based on options (e.g., `"orders-rt-${userId}-${statusFilter}"`). This prevents multiple hook instances from overwriting each other's subscriptions.

#### 3. No dashboard code changes needed

The admin, revendedor, and delivery dashboards already have the correct logic:
- Admin uses `useRealtimeOrders({ limit: 100 })` — sees all orders
- Revendedor uses `useRealtimeOrders({ userId: user?.id })` — sees own orders
- Delivery uses `useRealtimeOrders({ statusFilter: "en_delivery" })` and `useRealtimeOrders({ statusFilter: "entregado" })`
- Admin already has advance/revert buttons
- OrderDetail already fetches items from `order_items` on expand

The bugs are in RLS (blocking data) and channel collisions (breaking realtime), not in UI code.

### Files affected

| File | Change |
|------|--------|
| SQL migration | Add order_items RLS for delivery, re-create updated_at trigger |
| `src/hooks/useRealtimeOrders.ts` | Unique channel name per instance |

