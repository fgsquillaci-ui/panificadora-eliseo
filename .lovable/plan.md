

## Agregar recetas para Pan de Lomo 18cm y 23cm (Mayorista)

### Datos

Interpolación proporcional desde las recetas existentes del 15cm y 30cm.

**Pan de Lomo 18cm** (product_id: `b1b4e9d7-2a95-4a79-8068-a1c69d1a153d`):
| Ingrediente | Cantidad | Unidad |
|---|---|---|
| Harina | 0.075 | kg |
| Aceite | 4.5 | ml |
| Sal | 0.0015 | kg |
| Levadura | 0.0015 | kg |

**Pan de Lomo 23cm** (product_id: `a6553ed4-81c3-4070-ac2e-76d5486eab87`):
| Ingrediente | Cantidad | Unidad |
|---|---|---|
| Harina | 0.096 | kg |
| Aceite | 5.75 | ml |
| Sal | 0.0019 | kg |
| Levadura | 0.0019 | kg |

### Changes

**1. Database — Insert 8 recipe rows**

Insert recipe lines for both products using their ingredient IDs.

**2. Database — Sync `products.unit_cost`**

After inserting recipes, update `unit_cost` on both products by calculating `SUM(quantity * costo_unitario / 100)` from the recipe + ingredients.

**3. Backfill cost snapshots**

Call `backfill_cost_snapshots` for both product IDs to update any existing order items.

### Files

| Action | Target |
|---|---|
| DB Insert | `recipes` — 8 new rows |
| DB Update | `products.unit_cost` — 2 rows |
| DB RPC | `backfill_cost_snapshots` — 2 calls |

No code file changes needed.

