

## Diagnóstico y corrección de dashboards

### Problemas encontrados

1. **Redirección post-login**: Después de iniciar sesión, el usuario es redirigido a "/" (la tienda) en vez de su dashboard correspondiente. Esto dificulta encontrar el panel.

2. **Bug en política RLS de `orders` para delivery**: La política "Delivery can read assigned orders" tiene una comparación incorrecta (`d.order_id = d.id` en vez de `d.order_id = orders.id`), lo que impide que el delivery vea sus pedidos asignados.

3. **Bug en política RLS de `order_items` para delivery**: La política "Delivery can read assigned order_items" compara `d.order_id = d.order_id` (consigo misma, siempre true), lo que es incorrecto. Debería comparar con `order_items.order_id`.

### Cambios propuestos

#### 1. Migración: Corregir políticas RLS
- Eliminar y recrear la política de delivery en `orders`: usar `d.order_id = orders.id`
- Eliminar y recrear la política de delivery en `order_items`: usar correctamente la relación `deliveries.order_id = order_items.order_id` y `deliveries.delivery_user_id = auth.uid()`

#### 2. Login: Redirigir al dashboard según rol
- Modificar `src/pages/Login.tsx`: después de login exitoso, consultar `user_roles` y redirigir a `/admin`, `/revendedor` o `/delivery` según el rol. Si no tiene rol, ir a "/".

### Archivos afectados
- Migración SQL (nuevas políticas RLS)
- `src/pages/Login.tsx` (redirección post-login)

