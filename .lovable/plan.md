
## Plan: Migrar datos del Excel a la base de datos

### Resumen
Crear 3 tablas en Lovable Cloud que repliquen las hojas del Excel (productos, clientes, ventas) y migrar la app para leer productos desde la base de datos en vez del archivo estático.

### Tablas a crear

**1. `products`** — Catálogo de productos con precios
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | auto-generado |
| name | text | nombre del producto |
| category | text | "panes", "especiales", "tortilleria" |
| emoji | text | emoji visual |
| description | text | descripción del producto |
| unit | text (nullable) | ej: "docena", "pack x6" |
| retail_price | integer (nullable) | precio minorista en pesos |
| wholesale_price | integer (nullable) | precio mayorista en pesos |
| created_at | timestamptz | default now() |

RLS: lectura pública (SELECT para anon/authenticated), escritura solo para admins (futuro).

**2. `customers`** — Clientes
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | auto-generado |
| name | text | nombre del cliente |
| phone | text (nullable) | teléfono |
| customer_type | text | "mayorista" o "minorista" |
| created_at | timestamptz | default now() |

RLS: lectura pública por ahora.

**3. `sales`** — Registro de ventas
| Columna | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | auto-generado |
| sale_date | date | fecha de la venta |
| customer_id | uuid (FK → customers) | referencia al cliente |
| product_id | uuid (FK → products) | referencia al producto |
| quantity | integer | cantidad vendida |
| sale_type | text | "mayorista" o "minorista" |
| unit_price | integer | precio unitario aplicado |
| total | integer | total de la línea |
| created_at | timestamptz | default now() |

RLS: lectura pública por ahora.

### Datos iniciales
Insertar los datos del Excel:
- 21 productos (incluyendo los que no tienen precio aún, con valores null)
- 4 clientes de ejemplo
- 3 ventas de ejemplo

### Cambios en el código

**`src/data/products.ts`** — Mantener como fallback/tipos, exportar la interfaz y constantes (WHOLESALE_MIN_QTY, categories, getEffectivePrice).

**Nuevo `src/hooks/useProducts.ts`** — Hook con React Query que lee productos desde la tabla `products`. Si la tabla está vacía o hay error, usa el fallback local.

**`src/components/ProductCatalog.tsx`** — Usar `useProducts()` en vez de importar `products` directamente.

**`src/hooks/useCart.ts`** — Sin cambios, sigue usando el tipo `Product` y `getEffectivePrice`.

### Archivos a crear/modificar
| Archivo | Cambio |
|---|---|
| DB migration | Crear 3 tablas + RLS policies |
| DB insert | Insertar datos del Excel |
| `src/hooks/useProducts.ts` | Nuevo hook para leer productos de la BD |
| `src/components/ProductCatalog.tsx` | Usar hook en vez de datos estáticos |
| `src/data/products.ts` | Mantener tipos y helpers, quitar array de productos (o dejarlo como fallback) |
