

## Arquitectura Financiera Unificada — Plan de Implementacion

### Estado actual vs objetivo

| Modulo | Estado actual | Problema |
|--------|--------------|----------|
| Materia prima | `costo_unitario` manual, `purchases` registra compras | No hay historial automatico de costos al comprar |
| Recetas | Calcula costo dinamico desde `ingredients.costo_unitario` | Correcto, no requiere cambios |
| Productos | Solo precios de venta, sin `current_cost` ni `target_margin` | Admin no ve costo vs precio sugerido por producto |
| Pedidos | Guarda `unit_price` y `total` en `order_items` | No guarda snapshot de costo ni margen al momento de venta |
| Finanzas | Calcula costo estimado desde recetas actuales (no historico) | Si cambian costos, el historico financiero se distorsiona |

### Cambios incrementales (sin romper nada)

---

### 1. Migracion de base de datos

**a) Tabla `raw_material_cost_history`** — historial automatico de costos

```text
raw_material_cost_history
├── id (uuid PK)
├── ingredient_id (uuid FK → ingredients)
├── purchase_id (uuid FK → purchases, nullable)
├── old_cost (integer, centavos)
├── new_cost (integer, centavos)
├── created_at (timestamptz)
```

RLS: admin only.

**b) Columnas nuevas en `products`**

```sql
ALTER TABLE products ADD COLUMN target_margin numeric DEFAULT 30;
ALTER TABLE products ADD COLUMN last_cost_sync_at timestamptz;
```

No agregar `current_cost` como columna — se calcula dinamicamente desde recetas (SSOT). `target_margin` es configurable por producto.

**c) Columnas de snapshot en `order_items`**

```sql
ALTER TABLE order_items ADD COLUMN cost_snapshot integer DEFAULT 0;
ALTER TABLE order_items ADD COLUMN margin_snapshot numeric DEFAULT 0;
ALTER TABLE order_items ADD COLUMN product_id uuid;
```

Esto permite que finanzas use datos historicos inmutables.

**d) Columnas de estado de cobro en `orders`**

```sql
ALTER TABLE orders ADD COLUMN payment_status text NOT NULL DEFAULT 'no_cobrado';
-- valores: 'no_cobrado', 'parcial', 'cobrado'
```

---

### 2. Automatizar historial de costos en compras

Modificar `usePurchases.ts` → al registrar compra:
1. Calcular nuevo costo promedio ponderado
2. Insertar en `raw_material_cost_history` (old_cost, new_cost)
3. Actualizar `ingredients.costo_unitario` al promedio

Ya hace pasos 1 y 3 parcialmente. Agregar paso 2.

---

### 3. Snapshots al crear pedido

Modificar `CreateOrderForm.tsx` → al insertar `order_items`:
- Buscar receta del producto y calcular `cost_snapshot` (costo unitario de produccion)
- Calcular `margin_snapshot` = `(unit_price - cost_snapshot) / unit_price * 100`
- Guardar `product_id` para trazabilidad

---

### 4. Panel de productos con decision de precios

Crear nueva seccion en `OwnerDashboard` o pagina dedicada:
- Por producto: costo actual (receta), precio actual, margen actual, margen objetivo, precio sugerido
- Formula: `suggested_price = current_cost / (1 - target_margin/100)`
- Boton "Aplicar precio sugerido" (actualiza `retail_price` en products)
- Permitir editar `target_margin` por producto
- Colores: verde (margen >= objetivo), amarillo (5% debajo), rojo (margen negativo)

---

### 5. Finanzas basada en snapshots

Modificar `useProductProfitability.ts`:
- SI `order_items` tiene `cost_snapshot > 0` → usar snapshot (datos historicos)
- SI no tiene snapshot (pedidos viejos) → fallback a calculo desde recetas (comportamiento actual)

Esto garantiza que datos futuros sean inmutables y datos viejos sigan funcionando.

---

### 6. Estado de cobro en pedidos

Agregar selector de `payment_status` en el flujo de pedidos:
- En `AdminDashboard` y `Orders`: boton para marcar como cobrado
- Impacto en finanzas: separar ventas confirmadas vs cobradas
- En OwnerDashboard: mostrar "pendientes de cobro"

---

### 7. Alertas inteligentes (extender existentes)

Agregar al OwnerDashboard:
- Producto sin receta → alerta amarilla
- Costo = 0 en ingrediente con receta → alerta roja
- Margen < target_margin → alerta amarilla
- Pedidos no cobrados acumulados → alerta

Ya existen alertas de stock bajo y margen bajo. Extender logica.

---

### Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| Migracion SQL | `raw_material_cost_history`, columnas en `products`, `order_items`, `orders` |
| `src/hooks/usePurchases.ts` | Insertar en historial de costos al comprar |
| `src/components/CreateOrderForm.tsx` | Agregar snapshots al crear order_items |
| `src/hooks/useProductProfitability.ts` | Usar snapshots cuando disponibles |
| `src/pages/admin/OwnerDashboard.tsx` | Seccion de pricing por producto + alertas + pendientes de cobro |
| `src/pages/admin/Orders.tsx` | Boton cobrar pedido |
| `src/pages/admin/Dashboard.tsx` | Boton cobrar pedido |

### Lo que NO se modifica

- Tabla `recipes` (sigue siendo capa de transformacion pura)
- Tabla `ingredients` (estructura sin cambios, solo se le escribe automaticamente)
- `getUnitPrice` / pricing unificado (sigue igual)
- CustomerPicker, delivery dashboard
- Edge functions existentes

### Principios respetados

- SSOT: costos vienen de `ingredients.costo_unitario`, actualizado por compras
- Recetas: solo transformacion, costo siempre dinamico
- Snapshots: pedidos guardan foto del momento, finanzas los consume
- Control manual: admin decide cuando aplicar precio sugerido
- Compatibilidad: pedidos viejos sin snapshot usan fallback a recetas

