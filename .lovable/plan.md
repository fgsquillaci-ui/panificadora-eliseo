

## Crear 3 usuarios de prueba con roles

Como la tabla `profiles` requiere un usuario real en `auth.users` (el trigger `handle_new_user` crea el perfil automáticamente), necesitamos crear los usuarios a través de una edge function temporal que use el Admin API.

### Pasos

#### 1. Crear edge function temporal `create-test-users`
- Usa el service role key para crear usuarios via `supabase.auth.admin.createUser()`
- Crea 3 usuarios con contraseña `Test1234!` y auto-confirm habilitado:
  - `revendedor1@gmail.com` (nombre: "Revendedor 1")
  - `revendedor2@gmail.com` (nombre: "Revendedor 2")  
  - `delivery1@gmail.com` (nombre: "Delivery 1")
- El trigger `handle_new_user` creará automáticamente sus perfiles
- Después de crear cada usuario, inserta el rol correspondiente en `user_roles`

#### 2. Ejecutar la edge function
- Llamar la función para crear los usuarios y asignar roles

#### 3. Eliminar la edge function
- Borrar la función temporal ya que no se necesita más

### Resultado
- 3 usuarios con login funcional (contraseña: `Test1234!`)
- 2 con rol `revendedor`, 1 con rol `delivery`
- Visibles en el panel de gestión de usuarios del admin

