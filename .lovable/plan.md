

## Variable Expenses Estimation — Con correcciones de seguridad

### Cambios

**1. Migración — Agregar columna `estimated` + constraint**

```sql
ALTER TABLE public.recurring_expenses
ADD COLUMN IF NOT EXISTS estimated boolean DEFAULT false;

ALTER TABLE public.recurring_expenses
ADD CONSTRAINT valid_estimated_amount
CHECK (NOT (estimated = true AND amount IS NULL));
```

**2. `src/hooks/useRecurringExpenses.ts`**

- Agregar `estimated: boolean` a `RecurringExpense` interface y `RecurringExpenseInput`
- Validación en `validateInput`: si `estimated === true`, amount es requerido
- Incluir `estimated` en create/update
- Clasificación explícita (sin truthy/falsy):
  - `fixedItems` → `amount != null && item.estimated !== true`
  - `estimatedItems` → `amount != null && item.estimated === true`
  - `variableItems` → `amount == null`
- Nueva función `calcProjectedBreakdown(items, period, customRange)` → `{ fixed, estimated, total }` donde `total = fixed + estimated`
- `calcProjectedForPeriod` sigue igual (ya suma todo item con amount != null)

**3. `src/pages/admin/Expenses.tsx`**

- Form: agregar switch "Es gasto variable estimado" — si activado, amount requerido
- Tabla de gastos programados, columna Monto:
  - `amount != null && estimated !== true` → monto normal
  - `amount != null && estimated === true` → monto + Badge "Estimado" (secondary)
  - `amount == null` → Badge "Variable sin estimación" (outline)

**4. `src/pages/admin/OwnerDashboard.tsx`**

- Importar `calcProjectedBreakdown` del hook
- Calcular `{ fixed, estimated }` del breakdown
- Agregar KPI secundario "Variables estimados" con valor `estimated`
- Tooltip en "Disponible para retirar": "Incluye gastos fijos y variables estimados. No incluye variables sin estimación."
- Fórmula de `availableToWithdraw` NO cambia

### Lo que NO cambia

- `calcProjectedForPeriod` (ya incluye estimated automáticamente)
- Fórmula de `availableToWithdraw`
- Orders, costos, márgenes, edge functions

### Archivos

| Acción | Archivo |
|---|---|
| Migración | Agregar `estimated` boolean + constraint |
| Editar | `src/hooks/useRecurringExpenses.ts` — interface, validación, breakdown |
| Editar | `src/pages/admin/Expenses.tsx` — form toggle, badges |
| Editar | `src/pages/admin/OwnerDashboard.tsx` — KPI + tooltip |

