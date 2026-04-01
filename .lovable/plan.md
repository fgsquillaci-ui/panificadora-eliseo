

## Corregir interpretación de costos con stock cero

### Problema
Cuando el stock de un ingrediente llega a 0, el `costo_unitario` puede quedar en 0 (al no haber lotes con remanente, el promedio ponderado da 0). Esto contamina los cálculos de margen estimado y precios sugeridos, aunque los datos históricos (`cost_snapshot`) permanecen intactos.

### Cambios

**1. `useFinancialData.ts` — Margen real con warning**

- Línea 102: agregar `realMargin` derivado de `realCost` y `revenue`
- Exportar `realMargin` y flag `realCostMissing` (cuando `realCost === 0 && revenue > 0`)
- `estimatedCost`: ya ignora `unit_cost === 0` (línea 63), correcto

**2. `useProductProfitability.ts` — Ignorar unit_cost = 0**

- Línea 97-101: ya filtra `unitCost > 0` para `hasCost`. Correcto, no requiere cambios.

**3. `OwnerDashboard.tsx` — UI warnings**

- KPI "Margen" (línea 136): usar `realMargin` basado en costo real en vez de estimado; si `realCostMissing`, mostrar "N/D" con tooltip "Margen no disponible — falta costo histórico"
- Tabla de rentabilidad (línea 214): si `cost === 0` y `revenue > 0`, mostrar "Costo no disponible" en vez de "$0"
- Panel de precios (línea 72-73): ya filtra `hasRecipe: cost > 0`, correcto

**4. `useRecipes.ts` — No anular costo por stock cero**

- Línea ~90-91: actualmente `totalCost = null` si `hasZeroStock`. Cambiar: mantener `totalCost` calculado (basado en `costo_unitario` del ingrediente, que es el último conocido), pero seguir exponiendo `hasZeroStock` como flag de advertencia visual, no como anulación del costo
- Esto preserva el costo conocido para pricing mientras advierte que el stock está agotado

**5. `supabase/functions/create-order/index.ts` — Proteger costo_unitario**

- Línea ~180-190 (resync de `ingredients.costo_unitario`): cuando `SUM(quantity_remaining) = 0`, NO actualizar `costo_unitario` a 0. Mantener el valor anterior:

```sql
-- Solo actualizar costo si hay lotes con remanente
UPDATE public.ingredients
SET stock_actual = ${stockRow.total_stock},
    costo_unitario = CASE WHEN ${Number(stockRow.total_stock)} > 0
      THEN ${Number(costRow.avg_cost_cents)}
      ELSE costo_unitario END
WHERE id = ${ingId}
```

Mismo principio para `products.unit_cost`: solo actualizar si el costo calculado > 0.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `supabase/functions/create-order/index.ts` | No resetear `costo_unitario` ni `unit_cost` a 0 cuando stock se agota |
| `src/hooks/useFinancialData.ts` | Exportar `realMargin` y `realCostMissing` |
| `src/hooks/useRecipes.ts` | Mantener `totalCost` calculado aunque haya stock cero (flag visual sigue) |
| `src/pages/admin/OwnerDashboard.tsx` | Usar margen real, mostrar warnings cuando falta costo |

### Lo que NO cambia
- `cost_snapshot` en `order_items` (ya es correcto, datos históricos intactos)
- Revenue logic
- Schema de base de datos (sin migraciones)

