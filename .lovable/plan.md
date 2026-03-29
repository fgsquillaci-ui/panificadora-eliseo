

## Corrección Integral — Plan de Implementación

### Diagnóstico real del sistema actual

| Issue | Estado | Severidad |
|-------|--------|-----------|
| Order creation uses `as any` — masks type errors | Confirmado | Alta |
| No rollback si items fallan (order queda huérfano) | Confirmado | Alta |
| Revenue en profitability | Ya corregido (fallback total → unit_price*qty) | ✅ OK |
| Snapshots en order_items | Ya implementado (unit_price, total, cost_snapshot, margin_snapshot, pricing_tier_applied) | ✅ OK |
| Finanzas usa orders.total (no products) | Ya correcto en useFinancialData | ✅ OK |
| Costo receta como unitario sin rendimiento | No hay campo `rendimiento` — receta asume 1 unidad | Media |

### Cambios necesarios

**1. Edge function `create-order` — Transacción atómica**

Nueva edge function que recibe el pedido completo y ejecuta en una transacción SQL:

```text
BEGIN
  INSERT orders → get order_id
  INSERT order_items (con snapshots)
  UPDATE orders SET total = SUM(items.total)
  COMMIT
  
  Si falla → ROLLBACK automático
```

Esto elimina el problema de orders huérfanos y el error intermitente de items.

**2. `CreateOrderForm.tsx` — Llamar edge function**

Reemplazar las 2 llamadas separadas a Supabase (insert order + insert items) por una sola llamada a la edge function. Eliminar todos los `as any`.

El cálculo de snapshots (cost, margin, tier) se mantiene en frontend porque necesita datos de recetas y pricing que ya están cargados.

**3. `useProductProfitability.ts` — Clarificar costo**

El costo de receta (`costMap`) ya se calcula correctamente como suma de (cantidad_ingrediente × costo_unitario_ingrediente) por producto. Esto ES el costo unitario si la receta representa 1 unidad del producto (que es el modelo actual).

No agregar `rendimiento` ahora — sería una feature nueva que requiere migración y UI. El sistema actual es correcto bajo el supuesto de receta = 1 unidad.

**4. Productos sin receta**

Ya funciona: `margin = -1` se muestra como "No calculable" en el dashboard. Sin cambios.

### Archivos

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/create-order/index.ts` | Nueva edge function — transacción atómica |
| `src/components/CreateOrderForm.tsx` | Llamar edge function, eliminar `as any`, simplificar flujo |
| `supabase/config.toml` | Config para nueva function (verify_jwt = false ya es default) |

### Lo que NO se modifica

- `useProductProfitability.ts` (revenue y cost ya están corregidos)
- `useFinancialData.ts` (revenue total ya usa orders.total)
- `pricing.ts` (lógica de tiers correcta)
- Estructura de tablas (ya tiene todos los campos necesarios)
- Pedidos históricos
- Dashboards de delivery, revendedor

### Resultado

- Pedidos se crean atómicamente (sin orders huérfanos)
- Snapshots obligatorios validados server-side
- Sin `as any` en el flujo de creación
- Finanzas sin cambios (ya corregidas)

