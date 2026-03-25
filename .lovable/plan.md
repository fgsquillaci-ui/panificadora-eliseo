

## Sistema Profesional Completo — Plan de Implementacion

### Diagnostico de lo que falta

| Problema | Estado actual |
|----------|--------------|
| Registro crea profile pero NO customer | El trigger `handle_new_user` solo crea profile. Usuario registrado no aparece en clientes. |
| Personal solo tiene activar/desactivar | No hay estados Pausado/Baja. No se puede "dar de baja" (eliminar rol y mantener como cliente). |
| Ingredientes sin historial de compras | No hay tabla de compras ni costo ponderado. Solo costo fijo manual. |
| Nombre "Ingredientes" | Debe ser "Materia Prima" |

Lo que YA funciona y NO se toca: pricing unificado, metodo de pago, finanzas desde orders.total, recetas, order_history, error_logs, CustomerPicker, delivery.

---

### 1. Migracion de base de datos

**a) Trigger: registro publico crea customer automaticamente**

Modificar `handle_new_user` para que ademas de crear profile, cree un registro en `customers` con el mismo nombre/telefono y vincule `profiles.customer_id`.

**b) Agregar campo `staff_status` a profiles**

```sql
ALTER TABLE profiles ADD COLUMN staff_status text NOT NULL DEFAULT 'activo';
-- valores: 'activo', 'pausado', 'baja'
```

**c) Tabla `purchases` (compras de materia prima)**

```text
purchases
├── id (uuid PK)
├── ingredient_id (uuid FK → ingredients)
├── quantity (numeric)
├── unit_price (integer, centavos)
├── total_cost (integer, centavos)
├── date (date)
├── created_at (timestamptz)
```

RLS: admin only. Realtime habilitado.

**d) Agregar action `remove-role` a manage-users edge function**

Para dar de baja personal: eliminar de user_roles, marcar `staff_status = 'baja'`.

---

### 2. Registro publico → crear customer

Actualizar trigger `handle_new_user` para:
1. Insertar en `customers` (name, phone, created_by='registro')
2. Actualizar `profiles.customer_id` con el id del customer creado

Resultado: todo usuario registrado aparece como cliente automaticamente.

---

### 3. Gestion de Personal — Estados profesionales

**Reemplazar sistema actual en `Users.tsx`:**

- Mostrar estado: Activo (verde), Pausado (amarillo), Baja (rojo)
- Acciones por estado:
  - Activo → Pausar / Dar de baja
  - Pausado → Reactivar / Dar de baja
  - Baja → no aparece en lista (vuelve a ser solo cliente)
- "Dar de baja" = eliminar rol de `user_roles` + `staff_status = 'baja'`
- Personal dado de baja sigue visible en Clientes

**Actualizar edge function `manage-users`:**
- Nueva action `pause-user`: `staff_status = 'pausado'`
- Nueva action `remove-staff`: eliminar de `user_roles`, `staff_status = 'baja'`
- Action `update-user` con `staff_status = 'activo'` para reactivar

---

### 4. Renombrar Ingredientes → Materia Prima

- `DashboardLayout.tsx`: label "Ingredientes" → "Materia Prima"
- `Ingredients.tsx`: titulo "Ingredientes" → "Materia Prima", textos internos
- `useIngredients.ts`: sin cambios (tabla sigue siendo `ingredients`)

---

### 5. Compras de Materia Prima + Costo Ponderado

**Nuevo hook `usePurchases.ts`:**
- CRUD de compras vinculadas a ingredient_id
- Al registrar compra: actualizar `ingredients.stock_actual` (sumar quantity)
- Calcular costo promedio ponderado: `total_invertido / cantidad_total`

**Actualizar pagina `Ingredients.tsx`:**
- Agregar seccion "Compras" por ingrediente (historial)
- Boton "Registrar compra" (cantidad, precio unitario, fecha)
- Mostrar costo promedio vs costo actual
- Al registrar compra, stock se actualiza automaticamente

---

### 6. Panel de Analisis de Costos en OwnerDashboard

Agregar seccion en `OwnerDashboard.tsx`:
- Por producto: costo actual (receta) vs costo sugerido (promedio ponderado de compras)
- Diferencia %
- Alerta si diferencia > 15%
- Boton "Actualizar costo" que modifica `ingredients.costo_unitario` al promedio

---

### Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| Migracion SQL | `staff_status` en profiles, tabla `purchases`, trigger `handle_new_user` actualizado |
| `supabase/functions/manage-users/index.ts` | Actions: `pause-user`, `remove-staff` |
| `src/components/DashboardLayout.tsx` | "Ingredientes" → "Materia Prima" |
| `src/pages/admin/Ingredients.tsx` | Renombrar + agregar seccion compras |
| `src/pages/admin/Users.tsx` | Estados Activo/Pausado/Baja, dar de baja |
| `src/hooks/usePurchases.ts` | Nuevo — CRUD compras + costo ponderado |
| `src/pages/admin/OwnerDashboard.tsx` | Seccion analisis de costos sugeridos |

### Lo que NO se modifica

- Tabla orders, order_items, customers (estructura)
- Pricing unificado (getUnitPrice)
- Finanzas (ya usa orders.total correctamente)
- Delivery dashboard
- Recetas
- RLS existentes (solo agregar para purchases)
- CreateOrderForm, CustomerPicker

