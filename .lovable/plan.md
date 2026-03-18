

## Plan: Actualizar catálogo con precios mayorista/minorista y descuento automático

### Resumen
Reemplazar el catálogo actual con todos los productos de la planilla. Agregar precio mayorista a cada producto. Cuando un producto llegue a 10+ unidades en el carrito, se aplica automáticamente el precio mayorista.

### Cambios

**1. Actualizar `src/data/products.ts`**
- Agregar `wholesalePrice` (opcional) y `unit` (opcional, ej: "docena") al tipo `Product`
- Agregar constante `WHOLESALE_MIN_QTY = 10`
- Actualizar categorías: "Panes", "Especiales/Pizzas", "Tortillería"
- Reemplazar productos con los de la planilla:

| Producto | Minorista | Mayorista |
|---|---|---|
| Ciabattas | $3,000 | $700 |
| Focaccia | $5,500 | $3,300 |
| Pan Casero | $2,000 | $1,100 |
| Pan de Ajo | $2,000 | $1,150 |
| Pan de Hamburguesa | $1,000 | $700 |
| Pan de Lomo 15cm | $1,000 | $400 |
| Pan de Lomo 30cm | $1,100 | $700 |
| Pan de Pernil | — | $250 |
| Pizzetas 250gr-18cm | $700 | $450 |
| Pizzetas 80gr-8cm 12u | $4,000 | $2,500 |
| Pizzetas 80gr-8cm 6u | $2,000 | — |
| Prepizzas | $1,200 | $800 |
| Tortas pinchadas (docena) | $3,500 | $2,500 |
| Tortas raspadas (docena) | $3,500 | $2,500 |
| Tortas de chicharrón | $3,500 | $2,500 |

- Productos sin precio (Focaccia mini, Pan Brioche, Pan Relleno, Pan Saborizado, Pan Viena, Tortas de hoja) se omiten por ahora

**2. Actualizar `src/hooks/useCart.ts`**
- Agregar función helper `getEffectivePrice(product, quantity)` que devuelve `wholesalePrice` si `qty >= 10` y existe precio mayorista, sino `price`
- Actualizar `totalPrice` para usar precio efectivo según cantidad
- Actualizar `getWhatsAppUrl` para mostrar precio efectivo y marcar "(mayorista)" cuando aplique

**3. Actualizar `src/components/ProductCatalog.tsx`**
- Mostrar ambos precios en cada tarjeta: minorista y mayorista (si existe)
- Indicador visual: "Mayorista desde 10u: $X"

**4. Actualizar `src/components/Cart.tsx`**
- Recibir nueva prop o usar helper para mostrar precio efectivo por item
- Mostrar badge "Precio mayorista" cuando qty >= 10
- Mostrar precio unitario tachado (minorista) cuando se aplica mayorista

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/data/products.ts` | Nuevos productos, wholesalePrice, categorías |
| `src/hooks/useCart.ts` | Lógica de precio mayorista automático |
| `src/components/ProductCatalog.tsx` | Mostrar ambos precios |
| `src/components/Cart.tsx` | Indicador de descuento mayorista |

