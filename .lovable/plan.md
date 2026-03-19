

## Plan: Sistema de pedidos sincronizado con retroceso de estados y realtime

### Problemas identificados

1. **No hay retroceso de estados**: Admin solo puede avanzar, no corregir errores
2. **Delivery no ve pedidos**: El delivery dashboard filtra por `deliveries` table, pero los pedidos con status `en_delivery` no se asignan automaticamente a esa tabla
3. **Sin realtime**: Cambios en un dashboard no se reflejan en otros sin recargar
4. **Revendedor no ve cambios de estado**: Solo hace fetch una vez, sin suscripcion

### Cambios propuestos

#### 1. Migracion SQL: Habilitar realtime + columna updated_at

- `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;`
- Agregar columna `updated_at` con trigger que la actualice automaticamente en cada UPDATE
- Cambiar logica de delivery: en vez de depender de la tabla `deliveries`, el delivery dashboard mostrara TODOS los pedidos con `status = 'en_delivery'` directamente de `orders`
- Agregar RLS policy: delivery puede leer orders con status `en_delivery` (sin necesidad de asignacion en tabla deliveries)

#### 2. Hook reutilizable: `useRealtimeOrders`

**Nuevo archivo: `src/hooks/useRealtimeOrders.ts`**

Hook que:
- Hace fetch inicial de orders (con filtros opcionales por user_id, status, etc.)
- Se suscribe a `postgres_changes` en tabla `orders` para INSERT y UPDATE
- Actualiza el estado local automaticamente cuando llega un evento
- Retorna `{ orders, loading, refetch }`

#### 3. Admin Dashboard (`src/pages/admin/Dashboard.tsx`)

- Usar `useRealtimeOrders` en vez de fetch manual
- Agregar boton de **retroceso** junto al de avance:
  - `en_produccion` → `pendiente`
  - `listo` → `en_produccion`
  - `en_delivery` → `listo`
  - `entregado` no retrocede
- Ambos botones (avanzar/retroceder) visibles por pedido

#### 4. Admin Orders (`src/pages/admin/Orders.tsx`)

- Usar `useRealtimeOrders`
- Permitir retroceso en el Select de estados (current, next, previous)

#### 5. Delivery Dashboard (`src/pages/delivery/Dashboard.tsx`)

- **Cambio critico**: En vez de consultar tabla `deliveries`, consultar directamente `orders` con `status = 'en_delivery'`
- Usar `useRealtimeOrders` con filtro de status
- Al marcar entregado: actualizar solo `orders.status` a `entregado`
- Esto elimina la dependencia de la tabla `deliveries` para mostrar pedidos

#### 6. Revendedor Dashboard (`src/pages/revendedor/Dashboard.tsx`)

- Usar `useRealtimeOrders` con filtro `user_id = user.id`
- Estados se actualizan en tiempo real (ve cuando pasa a entregado)

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Realtime, updated_at, RLS delivery directo |
| `src/hooks/useRealtimeOrders.ts` | **Nuevo** - hook realtime |
| `src/pages/admin/Dashboard.tsx` | Realtime + botones retroceso |
| `src/pages/admin/Orders.tsx` | Realtime + retroceso en select |
| `src/pages/delivery/Dashboard.tsx` | Query directa a orders, realtime |
| `src/pages/revendedor/Dashboard.tsx` | Realtime |

