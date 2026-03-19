

## Sistema operativo interno para panificadora

### Resumen

Transformar los dashboards existentes en un sistema funcional de gestion de pedidos con creacion, seguimiento y entrega. Se agregan nuevos estados, columnas en la tabla orders, y flujos de creacion de pedidos para admin y revendedor.

### 1. Migracion de base de datos

**Modificar tabla `orders`:**
- Agregar columna `reseller_name` (text, nullable) -- nombre del revendedor
- Agregar columna `created_by` (text, default 'admin') -- "admin" o "revendedor"
- Cambiar el enum `order_status` para incluir los 5 estados: `pendiente`, `en_produccion`, `listo`, `en_delivery`, `entregado`
  - Los estados actuales `enviado` se mapean a `en_delivery`
- Actualizar registros existentes con `status = 'enviado'` a `'en_delivery'`

### 2. Componente reutilizable: CreateOrderForm

**Nuevo archivo: `src/components/CreateOrderForm.tsx`**

Formulario compartido entre admin y revendedor:
- Selector de productos (desde Supabase via `useProducts`)
- Input de cantidad por producto
- Carrito dinamico con total automatico
- Campos: nombre cliente, telefono, direccion (opcional)
- Boton "Enviar pedido"
- Props: `createdBy` ("admin" | "revendedor"), `resellerName` (string | null), `onSuccess` callback
- Al guardar: inserta en `orders` + `order_items`, status = "pendiente"

### 3. Dashboard Admin (`src/pages/admin/Dashboard.tsx`)

Reescribir con:
- **Metricas**: pedidos del dia, total vendido, cantidad por estado (5 estados)
- **Boton "Crear pedido"**: abre dialog con `CreateOrderForm` (created_by = "admin", reseller_name = null)
- **Lista de pedidos**: cards con cliente, revendedor (o "Directo"), productos resumidos, total, estado con color
- **Acciones secuenciales por pedido**: botones que solo permiten avanzar al siguiente estado valido:
  - pendiente → en_produccion
  - en_produccion → listo  
  - listo → en_delivery
  - en_delivery → entregado

### 4. Admin Orders (`src/pages/admin/Orders.tsx`)

Actualizar:
- Cambiar estados en el Select a los 5 nuevos
- Validar transicion secuencial (no saltar estados)
- Mostrar columna revendedor/directo

### 5. Dashboard Revendedor (`src/pages/revendedor/Dashboard.tsx`)

Agregar:
- **Boton "Nuevo pedido"**: abre dialog con `CreateOrderForm` (created_by = "revendedor", reseller_name = nombre del perfil)
- Mantener metricas y lista de pedidos existente
- Actualizar estados mostrados a los 5 nuevos

### 6. Dashboard Delivery (`src/pages/delivery/Dashboard.tsx`)

Actualizar:
- Filtrar pedidos con estado `en_delivery` (antes `enviado`)
- Boton "Marcar entregado" cambia a `entregado`
- Sin cambios estructurales mayores

### 7. Actualizar OrderDetail y colores

- Actualizar `statusLabels` y `statusColors` en todos los archivos para los 5 estados:
  - pendiente → gris
  - en_produccion → amarillo
  - listo → azul
  - en_delivery → naranja
  - entregado → verde

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Nuevas columnas, nuevo enum, update datos |
| `src/components/CreateOrderForm.tsx` | **Nuevo** - formulario de creacion |
| `src/pages/admin/Dashboard.tsx` | Reescribir con metricas, crear pedido, acciones secuenciales |
| `src/pages/admin/Orders.tsx` | Actualizar estados y validacion |
| `src/pages/revendedor/Dashboard.tsx` | Agregar boton crear pedido |
| `src/pages/delivery/Dashboard.tsx` | Cambiar filtro a en_delivery |
| `src/components/OrderDetail.tsx` | Actualizar labels/colores 5 estados |

### Notas
- No se modifica la landing ni componentes comerciales
- Se reutiliza `useProducts`, `DashboardLayout`, `OrderDetail`
- Mobile-first en todos los formularios

