

## Agregar período "Todo" + Selector de mes/rango personalizado

### Cambios

**1. `src/hooks/useFinancialData.ts`**

- Ampliar tipo `Period` a `"hoy" | "semana" | "mes" | "todo" | "custom"`
- Agregar parámetro opcional `customRange?: { from: string; to: string }`
- En `getPeriodStart`: cuando `period === "todo"`, retornar `"2020-01-01T00:00:00"` (fecha antigua para capturar todo)
- Cuando `period === "custom"`, usar `customRange.from`
- Agregar filtro `.lte("orders.created_at", end)` cuando hay rango custom o mes específico
- Aplicar mismo filtro de fecha fin a queries de `expenses` y `cash_movements`

**2. `src/hooks/useProductProfitability.ts`**

- Aceptar `customRange?: { from: string; to: string }` opcional
- Misma lógica: `"todo"` usa fecha antigua, `"custom"` usa `customRange.from/to`
- Agregar filtro `lte` cuando corresponda

**3. `src/pages/admin/OwnerDashboard.tsx`**

- Agregar `"todo"` al array de botones del period selector: `["hoy", "semana", "mes", "todo"]`
- Agregar estado `customRange` con `{ from, to }`
- Agregar un botón "Personalizado" que abre un `Popover` con:
  - Un `Select` con los últimos 6 meses (ej: "Marzo 2026", "Febrero 2026"...)
  - Dos inputs de fecha (desde/hasta) para rango libre
  - Botón "Aplicar"
- Al seleccionar un mes rápido, auto-setear `period = "custom"` y `customRange` al rango completo de ese mes
- Pasar `customRange` a ambos hooks

### Archivos

| Archivo | Cambio |
|---|---|
| `src/hooks/useFinancialData.ts` | Agregar `"todo"` y `"custom"` a Period, aceptar `customRange`, filtro `lte` |
| `src/hooks/useProductProfitability.ts` | Aceptar `customRange`, filtro `lte` |
| `src/pages/admin/OwnerDashboard.tsx` | Botón "Todo", selector de mes, popover de rango personalizado |

