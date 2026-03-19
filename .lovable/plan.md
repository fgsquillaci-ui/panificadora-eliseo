

## Actualizar contraseña del revendedor

Cambiar la contraseña en la edge function de `"Choy."` (5 caracteres) a `"Choy.1"` (6 caracteres) para cumplir el mínimo de Supabase Auth.

### Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/manage-users/index.ts` | Cambiar password de `"Choy."` → `"Choy.1"` en línea 28 |

Después de actualizar, se desplegará la function y se ejecutará para aplicar los cambios de ambos usuarios.

