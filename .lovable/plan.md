

## Fix: Pricing Sync + Historical Financial Integrity

### 3 cambios puntuales

**1. `src/hooks/useFinancialData.ts` — Línea 34**
Agregar `product_id` al SELECT para que `costMap[item.product_id]` funcione (actualmente siempre es `undefined` porque `product_id` no se solicita):
```
.select("product_id, total, unit_price, quantity, cost_snapshot, pricing_tier_applied, orders!inner(status, created_at)")
```

**2. `src/hooks/useFinancialData.ts` — Líneas 106-108**
Cambiar `realMargin` para que calcule siempre que haya revenue (sin exigir `realCost > 0`):
```ts
const realMargin = revenue > 0
  ? ((revenue - realCost) / revenue) * 100
  : null;
```

**3. `src/pages/admin/OwnerDashboard.tsx` — Línea 73**
Eliminar `.filter((p: any) => p.hasRecipe)` para mostrar TODOS los productos en la tabla de precios. Productos sin costo mostrarán margen "—" (ya manejado por `currentMargin === null` cuando `cost = 0` y `price = 0`).

### Archivos

| Archivo | Cambio |
|---|---|
| `src/hooks/useFinancialData.ts` | Agregar `product_id` al select, fix `realMargin` |
| `src/pages/admin/OwnerDashboard.tsx` | Eliminar filtro `hasRecipe` en pricing |

