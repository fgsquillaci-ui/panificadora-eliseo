

## Optimización del sistema: clientes, personal y pedidos

### Resumen

Renombrar "Usuarios" a "Personal", agregar botón "Asignar como personal" en clientes, y vincular profiles con customers. El flujo de creación automática de clientes desde pedidos ya funciona via CustomerPicker.

---

### 1. Migración de base de datos

Agregar `customer_id` (uuid, nullable, FK a customers) en la tabla `profiles` para vincular personal con su registro de cliente.

```sql
ALTER TABLE profiles ADD COLUMN customer_id uuid REFERENCES customers(id);
```

### 2. Renombrar "Usuarios" → "Personal"

**Archivos**: `DashboardLayout.tsx`, `Users.tsx`

- Sidebar: "Usuarios" → "Personal", path mantiene `/admin/usuarios`
- Título h1: "Gestión de usuarios" → "Gestión de personal"
- Botón: "Nuevo usuario" → "Nuevo personal"
- Textos internos del dialog y confirmaciones actualizados

### 3. Botón "Asignar como personal" en Admin Customers

**Archivo**: `src/pages/admin/Customers.tsx`

- Agregar botón en cada card de cliente activo: "Asignar como personal"
- Al hacer click: abre dialog con email, contraseña y selector de rol (admin/revendedor/delivery)
- Nombre y teléfono se precargan del cliente
- Al confirmar:
  1. Llama a `manage-users` edge function con action `create-user` + `customer_id`
  2. Actualiza `profiles.customer_id` con el id del cliente

### 4. Actualizar Edge Function `manage-users`

**Archivo**: `supabase/functions/manage-users/index.ts`

- En action `create-user`: aceptar campo opcional `customer_id`, y si se provee, guardarlo en `profiles.customer_id` tras crear el usuario

### 5. Indicador visual en lista de clientes

En `AdminCustomers`, si un cliente tiene un perfil vinculado (staff), mostrar badge "Personal" junto a su nombre para distinguirlo visualmente.

- Consultar profiles donde `customer_id` está en los IDs de clientes cargados
- Mostrar badge violeta "Personal" en esos clientes

### 6. Indicador en lista de personal

En `AdminUsers` (ahora "Personal"), mostrar el nombre del cliente vinculado si existe `customer_id` en el profile.

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Agregar `customer_id` a `profiles` |
| `supabase/functions/manage-users/index.ts` | Soportar `customer_id` en `create-user` |
| `src/components/DashboardLayout.tsx` | Renombrar "Usuarios" → "Personal" |
| `src/pages/admin/Users.tsx` | Renombrar textos a "Personal" |
| `src/pages/admin/Customers.tsx` | Botón "Asignar como personal" + dialog + badge |

### Lo que NO se modifica

- Flujo de pedidos (CustomerPicker ya crea clientes automáticamente)
- Dashboards de revendedor y delivery
- Lógica de roles y RLS existente
- Tabla customers (estructura sin cambios)

