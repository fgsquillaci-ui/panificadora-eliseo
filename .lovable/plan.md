

## Fix Pending Payments Detection

### Root Cause

Line 33 of `OwnerDashboard.tsx`:
```typescript
const { data } = await supabase.from("orders").select("total").eq("status", "entregado" as any);
```

Only `total` is selected — `payment_status` is **not included** in the query response. Line 34 then filters `payment_status !== "cobrado"`, but since `payment_status` is `undefined` on every row, the condition is always `true`. **Every delivered order is counted as pending.**

### Solution

Fix the query to select `payment_status`, filter at query level, and add a "Marcar como cobrado" button.

### Changes

**`src/pages/admin/OwnerDashboard.tsx` (lines 31-38)**

Replace the pending payments fetch with:
```typescript
const { data } = await supabase
  .from("orders")
  .select("id, total, payment_status")
  .eq("status", "entregado" as any)
  .neq("payment_status", "cobrado");
const items = data || [];
setPendingPayments({ count: items.length, total: items.reduce((s, o: any) => s + (o.total || 0), 0) });
```

Also store the pending order IDs so we can add a "Marcar como cobrado" action. Update state to include pending orders list, and add a button in the alert card or a small dialog to mark orders as paid (`payment_status = 'cobrado'`).

**Add "Marcar como cobrado" quick action:**

- In the pending payments alert area, add a button that opens a list of unpaid delivered orders
- Each order gets a "Cobrado" button that updates `payment_status` to `'cobrado'`
- After update, refetch pending payments

### Files

| File | Change |
|------|--------|
| `src/pages/admin/OwnerDashboard.tsx` | Fix pending query (add `payment_status` to select + filter at DB level), add mark-as-paid action |

### Unchanged

- DB schema (payment_status already exists with correct values)
- Order creation flow (already sets payment_status)
- Financial hooks
- Edge functions

### Expected Result

- Only truly unpaid delivered orders appear as pending
- Paid orders no longer counted
- Admin can mark orders as "cobrado" directly from dashboard

