

## Fix: Integridad de datos financieros históricos (versión final)

### Cambios

**1. `src/hooks/useFinancialData.ts`**

- Línea 68-73: Eliminar `if (costSnap > 0)` y reemplazar con detección de `null/undefined`:
```ts
const costSnap = item.cost_snapshot;
if (costSnap === null || costSnap === undefined) {
  totalMissingCost++;
} else {
  totalRealCost += costSnap;
}
```
- Agregar variable `totalMissingCost = 0` junto a las otras (línea 56)
- Agregar estado `itemsMissingCost` y setearlo con `totalMissingCost`
- Línea 103: Cambiar `realMargin`:
```ts
const realMargin = revenue > 0 && realCost > 0
  ? ((revenue - realCost) / revenue) * 100
  : (revenue > 0 ? null : 0);
```
- Agregar `hasPartialMissingCost = realCost > 0 && itemsMissingCost > 0`
- Exportar: `itemsMissingCost`, `hasPartialMissingCost`

**2. `src/hooks/useProductProfitability.ts`**

- Líneas 97-101: Reemplazar uso de `products.unit_cost` por `cost_snapshot`:
```ts
const costSnap = item.cost_snapshot;
if (costSnap !== null && costSnap !== undefined) {
  agg[pid].cost += costSnap;
  agg[pid].hasCost = true;
}
```
- Agregar `missingCostCount` al agregador para tracking
- Eliminar `unit_cost` del query de products (mantener precios para price deviation)

**3. `src/pages/admin/OwnerDashboard.tsx`**

- Línea 24: Agregar `itemsMissingCost`, `hasPartialMissingCost` al destructuring
- Después de los alerts existentes (~línea 179), agregar warnings:
  - Si `itemsMissingCost > 0`: "⚠️ Falta costo histórico en {N} venta(s)"
  - Si `hasPartialMissingCost`: "⚠️ Margen parcialmente confiable"
  - Si `realCost === 0 && revenue > 0`: "⚠️ Ganancia no confiable — no hay costos históricos"
- Línea 136 (Margen real KPI): si `realMargin === null`, mostrar "—" con tooltip "No se puede calcular — falta costo histórico"

### Archivos

| Archivo | Cambio |
|---|---|
| `src/hooks/useFinancialData.ts` | Eliminar filtro `costSnap > 0`, agregar `itemsMissingCost` y `hasPartialMissingCost` |
| `src/hooks/useProductProfitability.ts` | Usar `cost_snapshot` histórico en vez de `products.unit_cost` |
| `src/pages/admin/OwnerDashboard.tsx` | Warnings de datos incompletos, fix display de margen null |

