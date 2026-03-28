

## Snapshots obligatorios en pedidos nuevos — Plan

### Estado actual

Los snapshots **ya están implementados** en `CreateOrderForm.tsx`:

| Campo solicitado | Columna DB existente | Ya se guarda | Estado |
|---|---|---|---|
| `unit_price_at_sale` | `unit_price` | Sí (línea 172) | ✅ Funciona |
| `total_price` | `total` | Sí (línea 173, `unit_price * quantity`) | ✅ Funciona |
| `unit_cost_at_sale` | `cost_snapshot` | Sí (línea 175, desde recetas) | ✅ Funciona |
| `margin_at_sale` | `margin_snapshot` | Sí (línea 176, calculado) | ✅ Funciona |
| `pricing_tier_applied` | `pricing_tier_applied` | Sí (línea 177) | ✅ Funciona |

### Lo que falta

1. **Validación de completitud**: Si `cost_snapshot` es 0 (producto sin receta), el pedido se guarda igual sin advertencia. Debería al menos mostrar un warning.

2. **Error controlado si faltan datos**: El PRD pide "si falta alguno de estos datos, mostrar error controlado y evitar guardar datos incompletos". Actualmente no hay validación de que los snapshots estén completos antes de insertar.

### Cambios mínimos necesarios

**1. `CreateOrderForm.tsx`** — Agregar validación pre-insert de snapshots

Antes de insertar `order_items`, verificar que cada item tenga:
- `unit_price > 0`
- `product_id` presente
- `pricing_tier_applied` presente

Si `cost_snapshot === 0`, mostrar **warning** (no bloquear — un producto puede no tener receta aún) pero loguear.

Si `unit_price === 0` o `product_id` falta, **bloquear** con error y no guardar.

**2. Valores de tier**: Mapear los valores actuales (`minorista`, `intermedio`, `mayorista`) a los solicitados (`retail`, `mid_tier`, `wholesale`) o mantener los existentes por consistencia con datos históricos.

> Recomendación: **mantener los valores en español** (`minorista`, `intermedio`, `mayorista`) porque ya hay pedidos guardados con esos valores. Cambiarlos crearía inconsistencia.

### Archivos

| Archivo | Cambio |
|---|---|
| `src/components/CreateOrderForm.tsx` | Validación de snapshots completos antes de insert + warning si cost=0 |

### Lo que NO se modifica

- Estructura de DB (ya tiene todas las columnas)
- Pedidos históricos
- Lógica de pricing (`getUnitPrice`, `getPricingTier`)
- Finanzas, recetas, ingredientes

### Resumen

El sistema ya guarda los 5 snapshots solicitados. Solo falta agregar validación estricta para garantizar que no se guarden items incompletos, y un warning visible cuando un producto no tiene costo calculable.

