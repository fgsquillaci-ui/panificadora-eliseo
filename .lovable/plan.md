

## Expense Management System — Full Implementation Plan

### Summary

Create a dedicated "Gastos" module with strict validation, auto-computed amounts for raw materials, atomic batch creation via edge function, and safe edit/delete with FIFO cascade. Remove legacy expense/cash widgets from OwnerDashboard.

### Database Migration

Add columns to `expenses` table:

```sql
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'efectivo';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS supplier text DEFAULT '';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS ingredient_id uuid DEFAULT NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS quantity numeric DEFAULT NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT NULL;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS batch_id uuid DEFAULT NULL;
-- Rename 'type' to 'category' via new column + data migration
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'otros';
UPDATE public.expenses SET category = type;
```

Note: The existing `type` column remains for backward compatibility but `category` becomes the canonical field going forward.

---

### New Edge Function: `supabase/functions/manage-expense/index.ts`

Handles atomic create/update/delete for expenses with raw material integration.

**Create action:**
- If `category === "materia_prima"`: validate `ingredient_id`, `quantity > 0`, `unit_price > 0`. Compute `amount = quantity * unit_price`. In a single SQL transaction: insert expense → insert `ingredient_batch` → update expense with `batch_id` → run cascade resync (update ingredient stock, weighted cost, product unit_costs).
- Otherwise: validate `amount > 0`, ensure `ingredient_id/quantity/unit_price` are null.

**Delete action:**
- If expense has `batch_id`: delete batch → cascade resync → delete expense (all in transaction).
- Otherwise: just delete expense.

**Update action:**
- If old was materia_prima with batch: delete old batch, cascade resync old ingredient.
- If new is materia_prima: create new batch, assign batch_id, cascade resync new ingredient.
- Update expense record.

All operations wrapped in BEGIN/COMMIT/ROLLBACK.

---

### New Files

**1. `src/hooks/useExpenses.ts`**
- Fetches expenses with filters (category, date range)
- Calls edge function for create/update/delete
- Realtime subscription on `expenses` table
- Computes monthly/daily totals

**2. `src/components/expenses/ExpenseForm.tsx`**
- Category dropdown: materia_prima, alquiler, sueldos, servicios, transporte, packaging, gastos_personales, otros
- If `materia_prima`: show ingredient dropdown (from `useIngredients`), quantity, unit_price. **Hide** manual amount. Show "Total calculado: $X". Require all three fields.
- If other category: show amount field, hide ingredient fields.
- Payment method: efectivo / transferencia / tarjeta
- Supplier (optional), description, date
- Submit disabled when invalid

**3. `src/pages/admin/Expenses.tsx`**
- Header metrics: Total gastos del mes, Gastos hoy, % sobre ingresos
- `+ Registrar gasto` button opens dialog with ExpenseForm
- Table: Fecha, Categoría, Descripción, Monto, Método de pago, Proveedor, Acciones (edit/delete)
- Category and date filters
- Delete confirmation; for materia_prima warns about batch removal
- Uses `DashboardLayout`

---

### Modified Files

**4. `src/components/DashboardLayout.tsx`**
- Add nav item: `{ label: "Gastos", path: "/admin/gastos", icon: <Receipt />, roles: ["admin"] }` after Recetas

**5. `src/App.tsx`**
- Add route: `/admin/gastos` → `ExpensesPage`

**6. `src/pages/admin/OwnerDashboard.tsx`**
- Remove lines 89-115 (expense + cash form state/handlers)
- Remove lines 315-399 (Cash & Expenses grid with both cards)
- Keep all KPIs, alerts, product ranking, pricing panel, cost analysis

---

### Financial Integration (Verified)

`useFinancialData.ts` already correctly:
- Calculates `totalExpenses = SUM(expenses.amount)` (line 66)
- Has realtime subscription on `expenses` table (line 81)
- Includes date filtering on expenses (line 42)
- Profit formula at dashboard level: `revenue - estimatedCost - expenses` (line 80)

No changes needed.

---

### Category Values

| Value | Label |
|-------|-------|
| materia_prima | Materia Prima |
| alquiler | Alquiler |
| sueldos | Sueldos |
| servicios | Servicios |
| transporte | Transporte |
| packaging | Packaging |
| gastos_personales | Gastos personales |
| otros | Otros |

---

### Key Safety Rules

- `materia_prima` amount is ALWAYS computed (`quantity * unit_price`), never manual
- Stock only comes from `ingredient_batches` — no manual stock updates
- Historical orders/cost_snapshots are never modified
- Orphan check: if materia_prima expense has no batch_id, log error on fetch
- All batch operations atomic via edge function transaction

---

### Files Summary

| File | Change |
|------|--------|
| Migration | Add payment_method, supplier, ingredient_id, quantity, unit_price, batch_id, category to expenses |
| `supabase/functions/manage-expense/index.ts` | New: atomic CRUD with FIFO integration |
| `src/hooks/useExpenses.ts` | New: CRUD via edge function, filters, realtime |
| `src/components/expenses/ExpenseForm.tsx` | New: conditional form with auto-computed amount |
| `src/pages/admin/Expenses.tsx` | New: full expenses page with metrics + table |
| `src/components/DashboardLayout.tsx` | Add "Gastos" nav item |
| `src/App.tsx` | Add `/admin/gastos` route |
| `src/pages/admin/OwnerDashboard.tsx` | Remove cash/expense widgets (lines 89-115, 315-399) |

### Unchanged
- `useFinancialData.ts` (already correct)
- FIFO system, recipes, pricing logic
- Historical order data

