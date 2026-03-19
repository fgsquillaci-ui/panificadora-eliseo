

## Asignar roles a usuarios

### Usuarios existentes

Solo hay 2 usuarios registrados:
1. **Franco Squillaci** (`fgsquillaci@gmail.com`) — ID: `48668bda-b669-4fea-944c-26584c7cf15a`
2. **santana2022eliseo@gmail.com** — ID: `cb69d9a7-df33-4d69-8f70-f04483270cfd` (ya es admin)

### Acciones

**1. Asignar admin a Franco:**
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('48668bda-b669-4fea-944c-26584c7cf15a', 'admin');
```

**2. Crear usuarios simulados para pruebas:**

Como no puedo crear cuentas de login directamente, crearé perfiles ficticios con roles asignados. Estos aparecerán en el panel de admin para simular la gestión, pero no podrán iniciar sesión hasta que se registren con esos emails.

```sql
-- 2 revendedores simulados
INSERT INTO profiles (id, name, phone) VALUES
  (gen_random_uuid(), 'María Revendedora', '1155001111'),
  (gen_random_uuid(), 'Carlos Revendedor', '1155002222');

-- 1 delivery simulado  
INSERT INTO profiles (id, name, phone) VALUES
  (gen_random_uuid(), 'Pedro Delivery', '1155003333');
```

Luego asignar roles correspondientes a cada uno.

### Resultado
- 2 admins reales (pueden loguearse)
- 2 revendedores y 1 delivery visibles en el panel de gestión de usuarios
- Luego podrás modificar nombres y datos desde `/admin/usuarios`

