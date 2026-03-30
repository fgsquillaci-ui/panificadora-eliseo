

## Unified Pricing System — Price Deviation Fix

### Current State

- `useProductProfitability` has `unitPrice` (revenue/units) and `tierFilter` — both correct and needed for profitability analysis
- Pricing panel uses `unitPrice` from sales as "Precio real" — **incorrect per PRD**, should use `products` table prices
- `applySuggestedPrice` always updates `retail_price` — should be tier-aware
- No `priceDeviation` detection exists

### Changes

**1. `src/hooks/useProductProfitability.ts`**

- Remove `unitPrice` from `ProductProfit` interface
- Remove `unitPrice` calculation (line 82, 90)
- Add `priceDeviation: boolean` field
- Fetch products table once (outside loop): `retail_price`, `wholesale_price`, `intermediate_price` by `product_id`
- For each aggregated product:
  - Compute `averageUnitPrice = units > 0 ? revenue / units : 0`
  - Look up expected price using **each item's `pricing_tier_applied`** (not the UI filter):
    - `minorista` → `retail_price`
    - `intermedio` → `intermediate_price ?? retail_price`
    - `mayorista` → `wholesale_price ?? retail_price`
  - Since items are aggregated, use the **dominant tier** (most common `pricing_tier_applied` for that product) to pick expected price
  - `tolerance = expectedPrice * 0.05`
  - `priceDeviation = Math.abs(averageUnitPrice - expectedPrice) > tolerance`
  - If `units === 0`: `priceDeviation = false`

**2. `src/pages/admin/OwnerDashboard.tsx`**

**Profitability table (lines 186-213):**
- Remove "Precio prom." column header (line 190) and data cell (line 200)
- Add warning icon on product name if `priceDeviation === true`: "⚠ Precio aplicado difiere del oficial"

**Pricing panel (lines 39-69):**
- Replace `salesPriceMap` / `unitPrice` approach with tier-aware price from `products` table
- Fetch `retail_price`, `wholesale_price`, `intermediate_price` alongside existing `id, name, target_margin`
- Select price based on `tierFilter`:
  - `null` or `"minorista"` → `retail_price`
  - `"intermedio"` → `intermediate_price ?? retail_price`
  - `"mayorista"` → `wholesale_price ?? retail_price`
- Column label: "Precio actual" (replace "Precio real")
- Margin: `price > 0 ? ((price - cost) / price) * 100 : null`

**`applySuggestedPrice` (line 108-114):**
- Update the correct column based on `tierFilter`:
  - `null` or `"minorista"` → `retail_price`
  - `"intermedio"` → `intermediate_price`
  - `"mayorista"` → `wholesale_price`

### Updated Interface

```typescript
export interface ProductProfit {
  product_id: string;
  product_name: string;
  units_sold: number;
  revenue: number;
  cost: number;
  margin: number | null;
  hasRecipe: boolean;
  priceDeviation: boolean;
}
```

### Files

| File | Change |
|------|--------|
| `src/hooks/useProductProfitability.ts` | Remove `unitPrice`, add `priceDeviation` with tolerance-based detection using per-item tier |
| `src/pages/admin/OwnerDashboard.tsx` | Remove avg price column, fix pricing panel to use products table, tier-aware `applySuggestedPrice`, show deviation warning |

### Unchanged

- `useFinancialData.ts` (no pricing logic)
- DB schema, edge functions, CreateOrderForm, recipes, delivery

