

## Pricing por cantidad con 3 niveles — Plan

### Situacion actual

- `getUnitPrice` ya soporta 3 tipos de cliente (`minorista`, `intermedio`, `mayorista`) pero la logica por **cantidad** solo distingue 2 niveles: < 10 = retail, >= 10 = wholesale.
- La DB ya tiene `min_qty_mid_tier` (default 1) y `min_qty_wholesale` (default 10) en `products` (migracion pendiente del plan anterior). Tambien `intermediate_price`.
- El tipo `Product` en `data/products.ts` no incluye `minQtyMidTier` ni `minQtyWholesale`.
- `order_items` ya tiene `pricing_tier_applied` (pendiente de la migracion anterior).

### Cambios

**1. Migracion SQL** — agregar columnas si no existen

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_qty_mid_tier integer DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_qty_wholesale integer DEFAULT 10;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS pricing_tier_applied text;
```

**2. Tipo `Product`** — agregar campos en `src/data/products.ts`

Agregar `minQtyMidTier?: number` y `minQtyWholesale?: number` a la interfaz.

**3. `useProducts.ts`** — mapear nuevos campos desde DB

Mapear `min_qty_mid_tier` y `min_qty_wholesale` del resultado de Supabase.

**4. `getUnitPrice` en `src/lib/pricing.ts`** — logica de 3 niveles por cantidad

Nueva logica para clientes **minorista** (los mayoristas e intermedios siguen igual — siempre reciben su precio fijo):

```text
Para minorista:
  SI qty >= product.minQtyWholesale → wholesalePrice
  SI qty >= product.minQtyMidTier → intermediatePrice (o autocalculado)
  SINO → price (retail)
```

Auto-calculo de `intermediatePrice` cuando falta: `Math.round((retail + wholesale) / 2)`.

Retornar tambien el tier aplicado como segundo valor (o agregar funcion `getPricingTier`).

**5. `CreateOrderForm.tsx`** — guardar `pricing_tier_applied`

Al insertar `order_items`, incluir el tier aplicado (`minorista`, `intermedio`, `mayorista`).

**6. UI de productos en CreateOrderForm** — mostrar tier

Debajo del precio, mostrar badge con el nivel aplicado cuando qty > 1 y el tier no es minorista.

### Archivos

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | 3 columnas IF NOT EXISTS |
| `src/data/products.ts` | Agregar `minQtyMidTier`, `minQtyWholesale` a interfaz |
| `src/hooks/useProducts.ts` | Mapear campos nuevos |
| `src/lib/pricing.ts` | Logica 3 niveles por cantidad + auto-calculo mid + export `getPricingTier` |
| `src/components/CreateOrderForm.tsx` | Guardar `pricing_tier_applied`, mostrar badge de tier |

### Lo que NO se modifica

- Pedidos historicos
- Finanzas / OwnerDashboard
- Logica de clientes mayoristas/intermedios (siguen con precio fijo)
- CustomerPicker, delivery, edge functions

