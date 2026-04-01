

## Corregir `manage-expense` — mismo patrón que `create-order`

### Problema encontrado

La función `manage-expense/index.ts` tiene el mismo bug que ya se corrigió en `create-order`: cuando el stock se agota, sobreescribe `costo_unitario` y `unit_cost` con 0.

El resto del sistema está correcto:
- `useFinancialData.ts` usa `cost_snapshot` para costo real ✅
- `useRecipes.ts` mantiene `totalCost` aunque haya stock cero ✅
- `create-order/index.ts` ya protege ambos campos ✅
- `OwnerDashboard.tsx` muestra "N/D" cuando falta costo histórico ✅

### Cambio único

**`supabase/functions/manage-expense/index.ts`** — función `cascadeResync` (líneas 112-133):

1. **Línea 115**: Agregar `CASE WHEN` para no sobreescribir `costo_unitario` cuando stock = 0:
```sql
costo_unitario = CASE WHEN ${Number(stockRow.total_stock)} > 0
  THEN ${Number(costRow.avg_cost_cents)}
  ELSE costo_unitario END
```

2. **Línea 130-133**: Solo actualizar `unit_cost` si el costo calculado > 0:
```ts
const calcCost = Number(costCalc.unit_cost);
if (calcCost > 0) {
  await tx`UPDATE public.products SET unit_cost = ROUND(${calcCost}) WHERE id = ${product_id}`;
}
```

### Archivo afectado

| Archivo | Cambio |
|---|---|
| `supabase/functions/manage-expense/index.ts` | Proteger `costo_unitario` y `unit_cost` de reset a 0 |

