

## Hardening del Sistema — Plan de Implementacion

### Diagnostico

El sistema actual es funcional pero tiene gaps para uso real:
- No hay validacion server-side del total del pedido
- No hay historial de cambios en pedidos
- No hay log de errores
- No hay confirmacion antes de crear pedido
- El delivery ya muestra items correctamente via `OrderDetail` (no hay bug ahi)

### 1. Migracion de base de datos

Crear 2 tablas nuevas + 1 trigger de validacion:

```text
order_history
├── id (uuid PK)
├── order_id (uuid FK → orders)
├── action (text) — "created", "status_change", "edited"
├── old_value (text, nullable)
├── new_value (text, nullable)
├── user_id (uuid)
├── created_at (timestamptz)

error_logs
├── id (uuid PK)
├── message (text)
├── context (jsonb)
├── created_at (timestamptz)
```

RLS: Admin-only para ambas. Realtime en `order_history`.

Trigger en `orders`: al hacer UPDATE de status, insertar automaticamente en `order_history` con old/new status y `auth.uid()`.

### 2. Validacion de total en CreateOrderForm

Antes de guardar el pedido, recalcular total desde los items del carrito y comparar. Si no coincide, bloquear. Agregar validaciones:
- No permitir items con quantity <= 0
- No permitir total = 0
- No permitir pedido sin cliente
- No permitir pedido sin items

Ya existen las primeras 2 validaciones (cliente + items vacios). Agregar validacion de total y quantity.

### 3. Paso de confirmacion antes de crear pedido

En `CreateOrderForm.tsx`, agregar un estado `showConfirmation` que muestra un resumen (cliente, items, total, tipo de entrega) antes de ejecutar el insert. El usuario confirma o vuelve a editar.

### 4. Registro de historial en cambios de estado

En `AdminDashboard.tsx` y `AdminOrders.tsx`, despues de cada `update` exitoso de status, insertar un registro en `order_history`. Mismo tratamiento en `DeliveryDashboard.tsx` al marcar entregado.

Crear helper `logOrderAction(orderId, action, oldValue, newValue)` reutilizable.

### 5. Log de errores centralizado

Crear utility `logError(message, context)` que inserta en `error_logs`. Usar en los catch de:
- Creacion de pedidos
- Cambio de estado
- Creacion de clientes

### 6. Registro automatico de historial al crear pedido

Despues de crear pedido exitosamente en `CreateOrderForm`, insertar `order_history` con action = "created".

### Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| Migracion SQL | 2 tablas + trigger |
| `src/lib/orderHistory.ts` | Nuevo — helper logOrderAction + logError |
| `src/components/CreateOrderForm.tsx` | Confirmacion + validacion total + log |
| `src/pages/admin/Dashboard.tsx` | Usar logOrderAction en cambios de estado |
| `src/pages/admin/Orders.tsx` | Usar logOrderAction en cambios de estado |
| `src/pages/delivery/Dashboard.tsx` | Usar logOrderAction al marcar entregado |

### Lo que NO se modifica

- Estructura de orders, order_items, customers
- Dashboards de revendedor, clientes, personal, finanzas
- Edge functions
- Logica de CustomerPicker (ya funciona bien)
- OrderDetail (ya muestra items correctamente)

