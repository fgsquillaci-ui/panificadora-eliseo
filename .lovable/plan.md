

## Panel del Dueño — Implementacion completa

### Arquitectura de datos

**Tablas nuevas** (4 migraciones):

```text
ingredients
├── id (uuid PK)
├── name (text)
├── unit (text) — "kg", "litro", "unidad"
├── stock_actual (numeric, default 0)
├── stock_minimo (numeric, default 0)
├── costo_unitario (integer, centavos)
├── created_at (timestamptz)

recipes
├── id (uuid PK)
├── product_id (uuid FK → products)
├── ingredient_id (uuid FK → ingredients)
├── quantity (numeric) — cantidad por unidad de producto

expenses
├── id (uuid PK)
├── type (text) — "insumo", "servicio", "salario", "otro"
├── description (text)
├── amount (integer, centavos)
├── date (date)
├── created_at (timestamptz)

cash_movements
├── id (uuid PK)
├── type (text) — "ingreso", "egreso", "retiro"
├── description (text)
├── amount (integer)
├── date (date)
├── created_at (timestamptz)
```

RLS: Solo admin puede leer/escribir en las 4 tablas.

Realtime: Habilitar `ingredients`, `expenses`, `cash_movements` en `supabase_realtime`.

### Flujo de datos

```text
orders (entregado) → Ingresos
    └── order_items.product_name → products → recipes → ingredients → Costo
expenses → Gastos operativos
cash_movements → Flujo de caja
ingredients.stock_actual → Stock
```

- **Ingresos**: `SUM(total)` de orders con `status = 'entregado'`
- **Costo por producto**: `SUM(recipe.quantity * ingredient.costo_unitario)` por producto
- **Ganancia**: Ingresos - Costos estimados - Gastos
- **Stock**: Se descuenta manualmente o al registrar venta (futuro)

### Navegacion

Agregar al sidebar admin en `DashboardLayout.tsx`:
- "Finanzas" → `/admin/finanzas` (icon: DollarSign)
- "Ingredientes" → `/admin/ingredientes` (icon: Wheat)

Agregar rutas en `App.tsx`:
- `/admin/finanzas` → `OwnerDashboard`
- `/admin/ingredientes` → `IngredientsPage`

### Paginas nuevas (3 archivos)

**1. `src/pages/admin/OwnerDashboard.tsx`** — Panel principal del dueño

- **KPI Cards** (hoy / semana / mes toggle):
  - Ingresos (verde)
  - Costos estimados (naranja)  
  - Ganancia neta (verde/rojo)
  - Margen % (verde/amarillo/rojo)
  - Dinero disponible

- **Ranking de productos**: tabla con producto, unidades vendidas, ingreso, costo, margen %. Ordenado por margen. Alerta visual si margen < 20%.

- **Alertas inteligentes**: cards con:
  - Stock bajo (ingredientes bajo minimo)
  - Margen bajo por producto (< 20%)
  - Gastos altos (> 50% de ingresos)

- **Flujo de caja**: lista de cash_movements reciente + formulario para agregar movimiento (ingreso/egreso/retiro). Bloquear retiro si supera ganancia disponible.

- **Gastos**: lista de expenses + formulario para agregar gasto.

**2. `src/pages/admin/Ingredients.tsx`** — Gestion de ingredientes

- CRUD de ingredientes (nombre, unidad, stock, stock minimo, costo)
- Indicador visual de stock: verde (OK), amarillo (cerca del minimo), rojo (critico)

**3. `src/pages/admin/Recipes.tsx`** — Recetas por producto (o inline en Ingredients)

- Seleccionar producto → definir ingredientes y cantidades
- Calcular costo automaticamente
- Accesible desde OwnerDashboard como drill-down

### Hooks nuevos

- `useFinancialData(period)` — consulta orders entregados + expenses + cash_movements para el periodo
- `useIngredients()` — CRUD de ingredientes con realtime
- `useRecipes(productId?)` — CRUD de recetas, calculo de costo por producto
- `useProductProfitability(period)` — join order_items → products → recipes → ingredients para ranking

### Calculo de costos

```text
Costo unitario producto = SUM(recipe.quantity * ingredient.costo_unitario)
Costo total vendido = SUM(order_items.quantity * costo_unitario_producto)
Margen = (precio_venta - costo) / precio_venta * 100
```

Para productos sin receta definida: mostrar "Sin receta" y excluir del calculo de costos.

### Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| Migracion SQL | Crear 4 tablas + RLS + realtime |
| `src/pages/admin/OwnerDashboard.tsx` | Nuevo — panel financiero |
| `src/pages/admin/Ingredients.tsx` | Nuevo — gestion ingredientes |
| `src/pages/admin/Recipes.tsx` | Nuevo — recetas por producto |
| `src/hooks/useFinancialData.ts` | Nuevo |
| `src/hooks/useIngredients.ts` | Nuevo |
| `src/hooks/useRecipes.ts` | Nuevo |
| `src/hooks/useProductProfitability.ts` | Nuevo |
| `src/components/DashboardLayout.tsx` | Agregar 2 nav items |
| `src/App.tsx` | Agregar 3 rutas protegidas |

### Lo que NO se modifica

- Dashboards de pedidos, clientes, personal, revendedor, delivery
- Tabla orders, order_items, customers, profiles
- Flujo de creacion de pedidos
- Edge functions existentes

