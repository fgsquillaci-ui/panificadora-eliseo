

## Asignar rol Admin a santana2022eliseo@gmail.com

El usuario ya existe en la base de datos (ID: `cb69d9a7-...`). Solo se necesita insertar una fila en la tabla `user_roles`.

### Cambio

Ejecutar un INSERT en `user_roles` para asignar el rol `admin` a este usuario:

```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('cb69d9a7-df33-4d69-8f70-f04483270cfd', 'admin');
```

Esto es una operación de datos, no requiere cambios de código ni migraciones de esquema.

Una vez asignado, el usuario podrá acceder a `/admin`, `/admin/pedidos` y `/admin/usuarios` donde podrá gestionar roles de otros usuarios.

