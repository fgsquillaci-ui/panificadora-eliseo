

## Plan: Corregir precio mayorista de Ciabattas

### Cambio en `src/data/products.ts`

Actualizar la entrada de Ciabattas:
- **`wholesalePrice`**: cambiar de `700` a `2100` (precio mayorista por pack de 3)
- **`unit`**: cambiar de `"x3"` a `"pack x3"` para ser consistente con el formato usado en otros productos (ej: `"pack x6"`, `"pack x12"`, `"docena"`)

| Campo | Antes | Después |
|---|---|---|
| `wholesalePrice` | 700 | 2100 |
| `unit` | `"x3"` | `"pack x3"` |

