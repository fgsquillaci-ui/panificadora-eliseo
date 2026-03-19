

## Fix: Agregar perfil faltante para el admin Eliseo Santana

### Problema

El usuario `santana2022eliseo@gmail.com` tiene rol `admin` en `user_roles` pero no tiene registro en la tabla `profiles`. Por eso no aparece en la pantalla de gestión de usuarios.

### Solucion

Insertar el perfil faltante en la tabla `profiles` usando el insert tool:

```sql
INSERT INTO profiles (id, name, phone)
VALUES ('92bfec67-9902-4f87-a8f5-4c2760ce6905', 'Eliseo Santana', '')
ON CONFLICT (id) DO NOTHING;
```

### Resultado

- Eliseo Santana aparecera en la lista de usuarios con su badge de Admin
- Todos los usuarios podran hacer login:
  - `choyleonivas@gmail.com` / `Choy.1` (revendedor)
  - `santana2022eliseo@gmail.com` / `Turulo` (admin)
  - Franco Squillaci, Revendedor 2, Delivery 1 (usuarios existentes)

No se requieren cambios de codigo.

