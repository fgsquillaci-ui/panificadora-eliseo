

## Sistema de Gastos Recurrentes + Disponible para Retirar (con correcciones)

### Resumen

Crear tabla `recurring_expenses`, hook de CRUD + proyección, sección en Expenses, y métricas nuevas en OwnerDashboard. Con las correcciones solicitadas: sin clamp a 0, withdrawals desde `gastos_personales`, validación estricta de frecuencia/día, y constraint en DB.

### Cambios

**1. Migración — Tabla `recurring_expenses`**

```sql
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
```

**2. Hook — `src/hooks/useRecurringExpenses.ts`**

- CRUD via Supabase client (insert/update/delete)
- Form validation: enforce frequency/day rules before save
- `calcProjectedAmount(from, to)`: count occurrences per active expense with non-null amount, sum projections
- Variable expenses (amount IS NULL) listed separately
- Realtime subscription

**3. `src/hooks/useFinancialData.ts` — Compute `totalWithdrawals` from expenses**

Replace line 118:
```ts
// OLD: totalWithdrawals from cash_movements
const totalWithdrawals = cashMovements.filter(m => m.type === "retiro").reduce((s, m) => s + m.amount, 0);

// NEW: totalWithdrawals from expenses with category = "gastos_personales"
const totalWithdrawals = expensesList
  .filter((e: any) => e.category === "gastos_personales")
  .reduce((s: number, e: any) => s + (e.amount || 0), 0);
```

**4. `src/pages/admin/OwnerDashboard.tsx` — New KPIs**

Replace line 136 (`available` calculation):
```ts
// No clamping — show real value, positive or negative
const projectedRecurring = calcProjectedAmount(period, customRange); // from useRecurringExpenses
const availableToWithdraw = revenue - realCost - expenses - projectedRecurring - totalWithdrawals;
```

Update KPI grid to show:
- Ingresos
- Gastos reales
- Gastos fijos proyectados (new)
- Ganancia real
- Resultado proyectado: `revenue - realCost - expenses - projectedRecurring`
- **Disponible para retirar**: `availableToWithdraw` — green if positive, red if negative, **never clamped to 0**

**5. `src/pages/admin/Expenses.tsx` — Section "Gastos programados"**

Add below existing expenses table:
- Card with list of recurring expenses (name, amount or "Variable", frequency, active toggle)
- Create/Edit dialog with form: Nombre, Monto (optional), Frecuencia (select: Mensual/Semanal), Día (conditional: 1-31 or Lun-Dom), Fecha inicio, Activo
- Form validation: frequency determines which day field is required, the other must be null
- Delete confirmation

**6. Frequency validation rules (enforced in 3 layers)**

| Layer | Rule |
|---|---|
| DB constraint | `valid_frequency` + `valid_day_config` checks |
| Hook | Validate before insert/update, reject invalid combos |
| Form UI | Show day_of_month selector only when monthly, day_of_week only when weekly |

### What does NOT change

- Orders, cost calculation, margins, recipes, edge functions
- Existing `expenses` table structure
- `useFinancialData` internals (except `totalWithdrawals` source)

### Files

| Action | File |
|---|---|
| Migration | Create `recurring_expenses` table + constraints + RLS |
| Create | `src/hooks/useRecurringExpenses.ts` |
| Edit | `src/hooks/useFinancialData.ts` — `totalWithdrawals` from `gastos_personales` |
| Edit | `src/pages/admin/Expenses.tsx` — add recurring section |
| Edit | `src/pages/admin/OwnerDashboard.tsx` — new KPIs, no clamp on available |

