

## Fix: Stock no-bloqueante + Costo teórico completo

### Cambios

**1. Migración: Bootstrap de lotes iniciales**

```sql
INSERT INTO ingredient_batches (ingredient_id, quantity_total, quantity_remaining, unit_cost, purchase_date, supplier)
SELECT i.id, i.stock_actual, i.stock_actual, GREATEST(i.costo_unitario / 100.0, 0.01), CURRENT_DATE, 'Migración inicial'
FROM ingredients i
WHERE i.stock_actual > 0
  AND NOT EXISTS (SELECT 1 FROM ingredient_batches b WHERE b.ingredient_id = i.id AND b.quantity_remaining > 0);
```

**2. `supabase/functions/create-order/index.ts`**

Tres cambios en la lógica de procesamiento de items (líneas 147-213):

- **Agregar array `warnings`** al inicio de la transacción (antes del loop de items)
- **Línea 157**: agregar variable `let theoreticalCost = 0` junto a `itemCostPesos`
- **Dentro del loop de receta (línea 162)**: calcular costo teórico usando el `unit_cost` del ingrediente actual:
```ts
// Get ingredient's current unit cost for theoretical calculation
const [ingCost] = await tx`
  SELECT costo_unitario FROM public.ingredients WHERE id = ${recipe.ingredient_id}
`;
const ingUnitCostPesos = Number(ingCost.costo_unitario) / 100;
theoreticalCost += ingUnitCostPesos * neededQty;
```
- **Líneas 189-191**: reemplazar el `return { stockError }` por warning no-bloqueante:
```ts
if (remaining > 0) {
  warnings.push(`${recipe.ingredient_name}: faltan ${remaining.toFixed(2)} ${recipe.ingredient_unit}`);
  console.warn("Stock shortage (non-blocking):", {
    ingredient: recipe.ingredient_name, needed: neededQty,
    consumed: neededQty - remaining, shortage: remaining
  });
}
```
- **Línea 198**: usar costo teórico en vez de solo consumido:
```ts
const costSnapshot = hasRecipe ? theoreticalCost : (item.cost_snapshot ?? null);
const marginSnapshot = hasRecipe && theoreticalCost > 0 && item.total > 0
  ? ((item.total - theoreticalCost) / item.total) * 100
  : item.margin_snapshot;
```
- **Línea 269**: retornar warnings junto con id:
```ts
return { id: orderId, warnings };
```
- **Líneas 274-278**: eliminar el bloque `if (result.stockError)` (ya no existe)
- **Línea 280**: incluir warnings en respuesta exitosa:
```ts
return new Response(JSON.stringify({ id: result.id, warnings: result.warnings || [] }), { ... });
```

**3. `src/components/CreateOrderForm.tsx` — Línea 221-223**

Después del `toast.success`, mostrar warnings si los hay:
```ts
if (result?.warnings?.length > 0) {
  toast.warning("Pedido creado con faltantes de stock", {
    description: result.warnings.join(", "),
    duration: 8000,
  });
} else {
  toast.success("¡Pedido creado!");
}
onSuccess();
```

### Lógica de costo explicada

| Escenario | `itemCostPesos` (consumido) | `theoreticalCost` (usado para snapshot) |
|---|---|---|
| Stock completo | $500 | $500 |
| Stock parcial (50%) | $250 | $500 |
| Sin stock | $0 | $500 |

El `cost_snapshot` siempre refleja el costo real de producción, no lo que había en inventario. Esto evita márgenes inflados artificialmente.

### Archivos

| Acción | Archivo |
|--------|---------|
| Migración | Bootstrap lotes desde `stock_actual` |
| Editar | `supabase/functions/create-order/index.ts` — no-bloqueante + costo teórico |
| Editar | `src/components/CreateOrderForm.tsx` — mostrar warnings |

