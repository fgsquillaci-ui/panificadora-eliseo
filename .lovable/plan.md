

## Add Product: Pan de Pernil (Premium)

### What happens
A single row is inserted into the `products` table. No code changes needed — `useProducts` already includes products with `retail_price != NULL`.

### Database insert (idempotent)

```sql
INSERT INTO public.products (name, category, emoji, retail_price, wholesale_price, description)
SELECT
  'Pan de Pernil (Premium)', 'panes', '🥪', 320, NULL,
  'Pan de pernil premium con extras incluidos (costo no trackeado en receta)'
WHERE NOT EXISTS (
  SELECT 1 FROM public.products WHERE name = 'Pan de Pernil (Premium)'
);
```

### Result
- Product appears in frontend catalog, admin panel, and order creation automatically
- No duplicate if run multiple times
- Zero code changes

