

## Ajustes al catálogo público

### 1. Simplificar etiqueta mayorista (`src/components/ProductCatalog.tsx`)

Línea 93 — cambiar:
```
Mayorista desde {WHOLESALE_MIN_QTY}u: ${product.wholesalePrice.toLocaleString("es-AR")}
```
Por:
```
Mayorista: ${product.wholesalePrice.toLocaleString("es-AR")}
```

Eliminar el import de `WHOLESALE_MIN_QTY` del archivo.

La condición existente `{product.wholesalePrice && ...}` ya omite productos sin precio mayorista (undefined, null o 0), así que no se mostrará nada si no hay valor.

### 2. Eliminar productos fuera de venta (base de datos)

Migración SQL para borrar estos 5 productos:

| Producto | ID |
|---|---|
| Pan de Viena | `432a1eb6-9a3a-4947-8a3b-12b1ba7644a9` |
| Grisines | `bdacac09-6c30-416c-97f0-66ff0239d993` |
| Pan Árabe | `7bf86b74-da57-4e7c-b37f-89eb3d08f8d4` |
| Galleta Marinera | `4681089c-a642-4041-b9ad-e1c2c98b1a49` |
| Tapas de Empanada | `e09ee0da-b444-41db-9fe8-65de4e52e13f` |

```sql
DELETE FROM products WHERE id IN (
  '432a1eb6-9a3a-4947-8a3b-12b1ba7644a9',
  'bdacac09-6c30-416c-97f0-66ff0239d993',
  '7bf86b74-da57-4e7c-b37f-89eb3d08f8d4',
  '4681089c-a642-4041-b9ad-e1c2c98b1a49',
  'e09ee0da-b444-41db-9fe8-65de4e52e13f'
);
```

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/ProductCatalog.tsx` | Simplificar label mayorista, quitar import `WHOLESALE_MIN_QTY` |
| Migración SQL | Eliminar 5 productos de la base de datos |

