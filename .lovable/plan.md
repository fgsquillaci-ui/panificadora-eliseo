

## Plan: Mejorar Gestión de Usuarios con Multi-Rol

Hay dos problemas principales:

1. **El admin no puede ver los perfiles de otros usuarios** -- la RLS de `profiles` solo permite leer el propio perfil. El admin necesita una policy para leer todos.
2. **Un usuario solo puede tener un rol** -- la tabla `user_roles` tiene un UNIQUE constraint en `(user_id, role)`, pero el código actual borra todos los roles antes de insertar uno nuevo. Se necesita soporte multi-rol (ej: un delivery que también sea revendedor).

### Cambios

#### 1. Migración de base de datos
- Agregar RLS policy en `profiles`: "Admins can read all profiles" usando `has_role(auth.uid(), 'admin')`

#### 2. `src/pages/admin/Users.tsx` -- Reescribir con soporte multi-rol
- Cambiar de `role: string | null` a `roles: string[]` por usuario
- Reemplazar el Select (selector simple) por **checkboxes** para cada rol (admin, revendedor, delivery)
- Al marcar/desmarcar un checkbox:
  - Marcar: INSERT en `user_roles`
  - Desmarcar: DELETE de `user_roles` para ese user_id + role
- Mostrar múltiples badges por usuario (ej: "Delivery" + "Revendedor")
- Agregar buscador para filtrar usuarios por nombre

#### 3. `src/hooks/useRole.ts` -- Soporte multi-rol
- Cambiar de retornar un solo `role` a retornar `roles: AppRole[]`
- `hasRole(r)` ya funciona conceptualmente, solo necesita buscar en el array
- Actualizar `fetchRole` para traer todos los roles del usuario (sin `.single()`)

#### 4. `src/components/ProtectedRoute.tsx` -- Adaptar a multi-rol
- Verificar si el usuario tiene **alguno** de los `allowedRoles`, no solo uno exacto

#### 5. `src/components/DashboardLayout.tsx` -- Mostrar nav items de todos los roles
- Si un usuario es delivery + revendedor, mostrar ambos menús de navegación

| Archivo | Cambio |
|---|---|
| Migración DB | RLS: admin puede leer todos los profiles |
| `src/pages/admin/Users.tsx` | Checkboxes multi-rol, badges múltiples, buscador |
| `src/hooks/useRole.ts` | Retornar array de roles |
| `src/components/ProtectedRoute.tsx` | Verificar contra array de roles |
| `src/components/DashboardLayout.tsx` | Combinar nav items de múltiples roles |
| `src/components/Header.tsx` | Link al primer panel disponible según roles |

