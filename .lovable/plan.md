

## Fix: Pan de Hamburguesa sin costo ni margen

### Problema

El producto "Pan de Hamburguesa" tiene receta configurada (Harina, Sal, Huevo, Levadura) pero `unit_cost = 0` en la tabla de productos. Esto ocurrió porque la receta se creó antes de que existiera la sincronización automática. Como el backfill depende de que `unit_cost > 0`, tampoco puede corregir los pedidos históricos.

### Solución

1. **Actualizar `products.unit_cost`** para Pan de Hamburguesa calculando desde la receta:
   - Harina: 0.1 × 647.50 = $64.75
   - Sal: 0.002 × 320.00 = $0.64
   - Huevo: 0.1 × 233.33 = $23.33
   - Levadura: 0.003 × 5300.00 = $15.90
   - **Total: ~$105**

2. **Ejecutar `backfill_cost_snapshots`** para actualizar el pedido existente con el costo correcto.

### Cambios

| Acción | Detalle |
|---|---|
| DB Update | `products.unit_cost = 105` donde id = Pan de Hamburguesa |
| DB RPC | `backfill_cost_snapshots` para ese product_id |

No se requieren cambios de código. Solo datos.

