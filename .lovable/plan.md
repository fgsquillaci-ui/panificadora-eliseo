

## Corrección de finanzas: snapshots como fuente prioritaria

### Problema detectado

En `useProductProfitability.ts`, el revenue por producto usa `order_items.total`, que para pedidos antiguos puede ser 0 (valor default de la columna). Esto genera ingresos artificialmente bajos y márgenes absurdamente negativos. Los costos via snapshot son correctos pero el ingreso está corrupto por datos legacy.

### Cambios

**1. `src/hooks/useProductProfitability.ts`** — Corregir fuente de ingresos y separar legacy

- Al agregar items, calcular revenue como: `i.total > 0 ? i.total : i.unit_price * i.quantity` (fallback para items legacy donde total era 0 pero unit_price sí existe)
- Trackear por producto cuántos items son legacy (sin snapshot completo) vs nuevos
- En el resultado, agregar flag `hasLegacyData` para indicar datos mixtos
- Para items sin cost_snapshot Y sin receta: margen = -1, label "Sin costo"
- Para items con cost_snapshot = 0 pero con receta: usar fallback a receta

**2. `src/hooks/useProductProfitability.ts`** — Interfaz actualizada

```typescript
export interface ProductProfit {
  product_name: string;
  units_sold: number;
  revenue: number;
  cost: number;
  margin: number;
  hasRecipe: boolean;
  hasLegacyData: boolean; // nuevo: indica datos sin snapshot
}
```

**3. `src/pages/admin/OwnerDashboard.tsx`** — UI de rentabilidad

- Mostrar indicador visual cuando un producto tiene `hasLegacyData: true` (ícono de alerta con tooltip "Incluye datos históricos sin snapshot")
- Para productos sin costo: mostrar "Sin costo" en vez de "—" y "Sin receta" en margen (ya funciona, solo ajustar label)

**4. `src/hooks/useFinancialData.ts`** — Sin cambios

El hook de ingresos totales ya usa `orders.total` que es correcto (se guarda al crear pedido). No necesita ajuste.

### Archivos

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useProductProfitability.ts` | Fallback revenue, flag legacy, mejor lógica de cost |
| `src/pages/admin/OwnerDashboard.tsx` | Indicador visual de datos legacy en tabla |

### Lo que NO se modifica

- `useFinancialData.ts` (revenue total ya es correcto)
- `CreateOrderForm.tsx` (snapshots ya se guardan bien)
- Pedidos históricos en DB
- Pricing, recetas, ingredientes

