

## Agregar categoría "Postres" con productos

### Cambios

**1. `src/data/products.ts`**

- Línea 11: ampliar tipo `category` a `"panes" | "especiales" | "tortilleria" | "postres"`
- Línea 20: agregar `{ id: "postres" as const, name: "Postres", emoji: "🍰" }` al array `categories`

**2. Insertar productos en base de datos**

```sql
INSERT INTO products (name, category, emoji, retail_price, wholesale_price, unit_cost, description)
VALUES
  ('Budín', 'postres', '🍰', 6000, 4500, 0, 'Budín artesanal horneado con ingredientes naturales.'),
  ('Budín de pan', 'postres', '🍮', 1700, NULL, 0, 'Clásico budín de pan casero.'),
  ('Chocotorta', 'postres', '🍫', 2300, NULL, 0, 'Chocotorta cremosa con chocolinas y dulce de leche.'),
  ('Flan', 'postres', '🧁', 2000, NULL, 0, 'Flan casero con caramelo.');
```

### Sin cambios adicionales necesarios

- `useProducts.ts` ya mapea cualquier categoría del DB
- `ProductCatalog.tsx` ya itera el array `categories` — mostrará la pestaña automáticamente
- Sistema de precios, financiero y pedidos funcionan sin modificaciones

### Archivos

| Archivo | Cambio |
|---|---|
| `src/data/products.ts` | Agregar `"postres"` al tipo y al array de categorías |
| Base de datos (insert) | 4 productos de repostería |

