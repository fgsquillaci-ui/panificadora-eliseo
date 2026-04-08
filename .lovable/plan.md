

## Fix: Recurring Expense Projection Should Forecast Full Period

### Problem

The projection logic uses `to = now` for all periods (hoy, semana, mes, todo). This means it only counts recurring expense occurrences that have **already passed**, not future ones within the period. For a monthly projection, it should forecast through the **end of the month**, not just up to today.

With the current data (two recurring expenses with `start_date = 2026-04-08`, day 1 and day 10), neither shows any projected cost because day 1 and 10 haven't occurred after April 8.

### Fix — `src/hooks/useRecurringExpenses.ts`

Change `getPeriodRange` to use the **end of the period** instead of `now`:

```ts
// For "mes": to = endOfMonth(now) instead of now
// For "semana": to = endOfWeek(now) instead of now  
// For "hoy": keep to = endOfDay(now)
// For "todo": to = endOfMonth(now) (project through current month)
```

Import `endOfDay`, `endOfWeek`, `endOfMonth` from date-fns and update:

| Period | Current `to` | New `to` |
|---|---|---|
| hoy | `now` | `endOfDay(now)` |
| semana | `now` | `endOfWeek(now, {weekStartsOn:1})` (Sunday) |
| mes | `now` | `endOfMonth(now)` |
| todo | `now` | `endOfMonth(now)` |

This single change will make the "Gastos fijos proy." metric show the projected recurring costs for the full selected period, which is the expected behavior for financial forecasting.

### Files

| File | Change |
|---|---|
| `src/hooks/useRecurringExpenses.ts` | Update `getPeriodRange` to use end-of-period dates |

