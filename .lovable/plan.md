

## Dashboard mejorado con detalle de pedidos para los 3 roles

### Problema actual
- **Admin Dashboard**: Solo muestra 4 tarjetas de estadísticas sin lista de pedidos ni detalle.
- **Revendedor Dashboard**: Lista pedidos pero sin mostrar los productos (items) de cada pedido.
- **Delivery Dashboard**: Lista entregas sin mostrar qué productos contiene cada pedido.

### Cambios propuestos

#### 1. Componente compartido `OrderDetail`
Crear `src/components/OrderDetail.tsx` — un componente expandible/colapsable que muestra los items de un pedido. Al hacer click en un pedido, se expande mostrando:
- Lista de productos (`order_items`: nombre, cantidad, precio unitario, subtotal)
- Total del pedido
- Datos de contacto y dirección

Se reutiliza en los 3 dashboards.

#### 2. Admin Dashboard (`src/pages/admin/Dashboard.tsx`)
- Mantener las 4 tarjetas de estadísticas arriba
- Agregar debajo una sección "Últimos pedidos" con los pedidos recientes (últimos 10)
- Cada pedido es expandible para ver el detalle con `OrderDetail`
- Filtro rápido por estado (pendiente/en_produccion/enviado/entregado)
- Mostrar nombre del cliente, estado, total, fecha, y tipo de entrega

#### 3. Revendedor Dashboard (`src/pages/revendedor/Dashboard.tsx`)
- Agregar tarjetas resumen arriba: total gastado, pedidos pendientes, pedidos entregados
- Cada pedido en la lista ahora es expandible con `OrderDetail` para ver los productos
- Agregar filtro por estado

#### 4. Delivery Dashboard (`src/pages/delivery/Dashboard.tsx`)
- Agregar tarjetas resumen: entregas pendientes, entregas completadas
- Cada entrega ahora es expandible con `OrderDetail` para ver los productos del pedido
- Mantener el botón "Marcar entregado"

### Detalle técnico

- **Consulta de items**: Al expandir un pedido se hace `supabase.from("order_items").select("*").eq("order_id", orderId)` (lazy loading para no cargar todo de golpe)
- **RLS**: Los `order_items` ya tienen políticas para admin (ALL), usuarios propios (SELECT por user_id en orders), y delivery (SELECT por deliveries). No se necesitan cambios de esquema.
- **UI**: Usar `Collapsible` de shadcn/ui para expand/collapse. Iconos `ChevronDown`/`ChevronUp`.
- No se requieren migraciones de base de datos.

### Archivos a crear/modificar
1. **Crear** `src/components/OrderDetail.tsx` — componente reutilizable
2. **Modificar** `src/pages/admin/Dashboard.tsx` — agregar lista de pedidos con detalle
3. **Modificar** `src/pages/revendedor/Dashboard.tsx` — agregar resumen + detalle expandible
4. **Modificar** `src/pages/delivery/Dashboard.tsx` — agregar resumen + detalle expandible

