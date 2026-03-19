

## Plan: Gestionar usuarios de autenticación

### Lo que se necesita

1. **Cambiar email de "Revendedor 1"** (id: `b0b8da90-...`) de `revendedor1@gmail.com` → `choyleonivas@gmail.com` y su contraseña a `Choy.`
2. **Crear nuevo usuario admin** `santana2022eliseo@gmail.com` con contraseña `Turulo` y asignarle rol `admin`

### Cómo se implementará

Estas operaciones requieren la API de administración de autenticación (service role key). Se creará una **backend function** (`manage-users`) que:

1. Recibe las operaciones a realizar
2. Usa el service role key para:
   - Actualizar email y password del usuario existente (Revendedor 1)
   - Actualizar su nombre en profiles a "Choy"
   - Crear el nuevo usuario con email confirmado automáticamente
   - Insertar su perfil en `profiles`
   - Asignarle rol `admin` en `user_roles`
3. Se invoca una sola vez y luego queda disponible para futuras gestiones

### Archivos

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/manage-users/index.ts` | **Nuevo** - Edge function para gestión de usuarios |

Después de deployar la function, se ejecutará para aplicar los cambios.

