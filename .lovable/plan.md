

## Ajuste responsive mobile para todos los dashboards

### Problema
En viewport mobile (390px), varios elementos se desbordan o quedan incómodos: controles de período/filtro apilados horizontalmente, tablas con muchas columnas, paddings excesivos, y botones de acción que no caben.

### Cambios

**1. `src/components/DashboardLayout.tsx`**
- Reducir padding del `main` en mobile: `p-3 md:p-8`
- Mobile nav: agregar `px-2` para que los tabs no queden pegados al borde

**2. `src/pages/admin/Dashboard.tsx`**
- Título + botón "Crear pedido": stack vertical en mobile (`flex-col sm:flex-row`)
- Botón "Crear pedido" full-width en mobile
- Cards: reducir padding en mobile (`p-3 md:p-5`)
- Textos grandes en cards: `text-xl md:text-2xl`

**3. `src/pages/admin/OwnerDashboard.tsx`** (el más complejo)
- Header: stack vertical completo en mobile
- Controles de período y tier: stack vertical, cada uno full-width en mobile
- Period buttons: hacer scroll horizontal en mobile en vez de wrap
- KPI cards: `p-3` en mobile, texto `text-lg md:text-xl`
- Alertas: texto más pequeño en mobile
- Tablas de rentabilidad/precios: ya tienen `overflow-x-auto`, asegurar `min-w` en las tablas para scroll limpio

**4. `src/pages/admin/Orders.tsx`**
- Cada order card: stack vertical completo en mobile (ya tiene `flex-col sm:flex-row`)
- Botones de acción: full-width en mobile

**5. `src/pages/admin/Expenses.tsx`**
- Métricas: `grid-cols-1 sm:grid-cols-3` (ya está bien)
- Tabla de gastos: agregar `min-w-[600px]` para scroll horizontal limpio
- Tabla de gastos programados: `min-w-[500px]`

**6. `src/pages/admin/Customers.tsx`, `Users.tsx`, `Ingredients.tsx`, `Recipes.tsx`**
- Revisar que tablas tengan `overflow-x-auto` con `min-w` adecuado
- Headers con botones: stack vertical en mobile

**7. `src/pages/revendedor/Dashboard.tsx`**
- Mismo patrón: título + botón stack vertical en mobile
- Cards padding reducido

**8. `src/pages/delivery/Dashboard.tsx`**
- Cards `grid-cols-3`: reducir a `grid-cols-1 sm:grid-cols-3` para mobile
- Padding reducido en cards

**9. `src/components/OrderDetail.tsx`**
- Tabla interna de productos: agregar `min-w-[400px]` para scroll limpio
- Actions wrapper: `justify-end` a `justify-start` en mobile para mejor accesibilidad

**10. `src/components/CreateOrderForm.tsx`**
- Grid de productos: `grid-cols-2` ya está bien
- Asegurar que el dialog con `max-h-[70vh]` funcione bien en mobile

### Alcance
Solo cambios de CSS/Tailwind classes. No hay cambios de lógica ni de base de datos.

