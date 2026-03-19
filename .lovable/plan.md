

## Plan: Sistema de Usuarios y Gestión Interna

Este es un proyecto grande. Lo divido en fases para implementar de forma incremental.

---

### Fase 1: Roles y Base de Datos (fundación)

**Migración de base de datos:**

1. Crear enum `app_role` con valores: `admin`, `revendedor`, `delivery`
2. Crear tabla `user_roles` (id, user_id, role) con RLS usando función `has_role` security definer
3. Crear tabla `orders` (id, user_id, status, delivery_type, address, references, pickup_time, customer_name, customer_phone, total, created_at)
   - `status`: enum `order_status` con valores `pendiente`, `en_produccion`, `enviado`, `entregado`
4. Crear tabla `order_items` (id, order_id, product_name, quantity, unit_price, total)
5. Crear tabla `deliveries` (id, order_id, delivery_user_id, status, created_at)
6. RLS policies:
   - `orders`: admin ve todo, revendedor solo sus pedidos, delivery solo pedidos asignados
   - `order_items`: acceso basado en acceso al order padre
   - `deliveries`: admin ve todo, delivery solo los suyos
   - `user_roles`: admin puede CRUD, otros solo lectura propia

**Código:**
- Crear `src/hooks/useRole.ts` — consulta `user_roles` y expone `role` + `hasRole()`
- Actualizar `useAuth.ts` para incluir el rol del usuario

---

### Fase 2: Rutas Protegidas y Layout

**Nuevas páginas y rutas:**

| Ruta | Componente | Acceso |
|---|---|---|
| `/admin` | `AdminDashboard` | Solo admin |
| `/admin/pedidos` | `AdminOrders` | Solo admin |
| `/admin/usuarios` | `AdminUsers` | Solo admin |
| `/revendedor` | `RevendedorDashboard` | Solo revendedor |
| `/delivery` | `DeliveryDashboard` | Solo delivery |

**Componentes:**
- `src/components/ProtectedRoute.tsx` — wrapper que verifica autenticación + rol, redirige a `/login` si no autorizado
- `src/components/DashboardLayout.tsx` — sidebar + header para paneles internos
- Actualizar `App.tsx` con las nuevas rutas protegidas

---

### Fase 3: Panel Admin

**Dashboard principal (`/admin`):**
- Tarjetas resumen: ventas del día, pedidos activos, pedidos entregados
- Consultas a tablas `orders` y `order_items`

**Gestión de pedidos (`/admin/pedidos`):**
- Lista de todos los pedidos con filtros por estado
- Cambiar estado del pedido (pendiente → en produccion → enviado → entregado)
- Asignar delivery a un pedido

**Gestión de usuarios (`/admin/usuarios`):**
- Lista de usuarios registrados con su rol
- Asignar/cambiar roles (INSERT/UPDATE en `user_roles`)

---

### Fase 4: Panel Revendedor

**Dashboard (`/revendedor`):**
- Crear pedido (reutiliza catálogo de productos + checkout, pero guarda en DB en vez de WhatsApp)
- Lista de pedidos propios con estado
- Historial de compras

---

### Fase 5: Panel Delivery

**Dashboard (`/delivery`):**
- Lista de pedidos asignados (filtrado por `deliveries.delivery_user_id`)
- Ver dirección de entrega
- Botón "Marcar como entregado" (actualiza status)

---

### Archivos nuevos estimados

| Archivo | Descripción |
|---|---|
| `src/hooks/useRole.ts` | Hook para consultar rol del usuario |
| `src/components/ProtectedRoute.tsx` | Guard de rutas por rol |
| `src/components/DashboardLayout.tsx` | Layout compartido para paneles |
| `src/pages/admin/Dashboard.tsx` | Resumen general admin |
| `src/pages/admin/Orders.tsx` | Gestión de pedidos |
| `src/pages/admin/Users.tsx` | Gestión de usuarios |
| `src/pages/revendedor/Dashboard.tsx` | Panel revendedor |
| `src/pages/delivery/Dashboard.tsx` | Panel delivery |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | Agregar rutas protegidas |
| `src/hooks/useAuth.ts` | Incluir rol en el estado |
| `src/components/Header.tsx` | Link al panel según rol |

### Notas técnicas

- Los roles se almacenan en tabla separada `user_roles`, nunca en `profiles` (seguridad)
- Función `has_role()` como security definer para evitar recursión en RLS
- El primer admin se asigna manualmente via backend (no hay auto-admin)
- Las tablas existentes (`customers`, `sales`, `products`) se mantienen; `orders` es nueva y separada

---

### Recomendacion de implementacion

Dado el tamaño, sugiero implementar **Fase 1 + Fase 2** primero (roles, DB, rutas protegidas) y luego iterar con las fases de paneles. Esto establece la fundación segura antes de construir UI.

