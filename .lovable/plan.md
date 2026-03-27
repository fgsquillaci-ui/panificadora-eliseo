

## Pantalla de Administracion de Precios — Plan

### Objetivo

Nueva pagina `/admin/productos` donde el admin puede ver y editar los 3 precios y 2 umbrales de cada producto en una tabla editable.

### Implementacion

**1. Nueva pagina `src/pages/admin/Products.tsx`**

Tabla con todos los productos mostrando:
- Nombre y categoria
- Precio Minorista (`retail_price`) — editable inline
- Precio Intermedio (`intermediate_price`) — editable inline
- Precio Mayorista (`wholesale_price`) — editable inline
- Cant. min Intermedio (`min_qty_mid_tier`) — editable inline
- Cant. min Mayorista (`min_qty_wholesale`) — editable inline
- Boton "Guardar" por fila

Requiere RLS: actualmente `products` solo tiene SELECT publico. Se necesita agregar policy para que admins puedan UPDATE.

**2. Migracion SQL**

```sql
CREATE POLICY "Admins can manage products" ON products
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
```

**3. Ruta en `App.tsx`**

Agregar `/admin/productos` con `ProtectedRoute allowedRoles={["admin"]}`.

**4. Nav en `DashboardLayout.tsx`**

Agregar item "Productos" con icono `Tag` entre "Recetas" y el separador de revendedor.

### Archivos

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | RLS admin para INSERT/UPDATE/DELETE en products |
| `src/pages/admin/Products.tsx` | Nueva pagina — tabla editable de precios |
| `src/App.tsx` | Ruta `/admin/productos` |
| `src/components/DashboardLayout.tsx` | Nav item "Productos" |

### Lo que NO se modifica

- Logica de pricing (`getUnitPrice`)
- CreateOrderForm, OwnerDashboard
- Estructura de la tabla products (ya tiene todos los campos)

