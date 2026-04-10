

## Add Wholesale Products — Pan de Lomo 18cm y 23cm (Production Ready)

### Changes

**1. Database — Insert 2 new products**

```sql
INSERT INTO public.products (name, category, emoji, retail_price, wholesale_price, description)
VALUES
  ('Pan de Lomo 18cm (Mayorista)', 'panes', '🥖', NULL, 420, 'Pan de lomo 18cm — producción especial mayorista'),
  ('Pan de Lomo 23cm (Mayorista)', 'panes', '🥖', NULL, 450, 'Pan de lomo 23cm — producción especial mayorista');
```

**2. `src/hooks/useProducts.ts` — Support wholesale-only products**

Two changes on the existing mapping (line 19 and line 23):

- **Filter**: include products with either retail or wholesale price
  ```typescript
  // Before: data.filter(p => p.retail_price != null)
  // After:  data.filter(p => p.retail_price != null || p.wholesale_price != null)
  ```

- **Price fallback**: use wholesale price when retail is null
  ```typescript
  // Before: price: p.retail_price ?? 0,
  // After:  price: p.retail_price ?? p.wholesale_price ?? 0,
  ```

### What does NOT change

- `getUnitPrice` / `getPricingTier` in `src/lib/pricing.ts` — already handles `wholesalePrice` fallback correctly
- `CreateOrderForm` — already uses `getUnitPrice` which returns `wholesalePrice` when tier is "mayorista"
- Product interface, orders, costs, margins, edge functions

### Files

| Action | Target |
|---|---|
| DB Insert | `public.products` — 2 new rows |
| Edit | `src/hooks/useProducts.ts` — filter + price fallback (2 lines) |

