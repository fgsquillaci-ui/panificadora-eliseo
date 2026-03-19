

## Plan: Ocultar productos sin precio del catálogo

### Cambio
En `src/hooks/useProducts.ts`, filtrar los productos que no tengan `retail_price` definido antes de devolverlos. Así, productos como Pan Árabe, Pan de Viena, Grisines, etc. no aparecerán hasta que se les asigne un precio en la base de datos.

### Archivo a modificar
| Archivo | Cambio |
|---|---|
| `src/hooks/useProducts.ts` | Agregar `.filter(p => p.retail_price != null)` antes del `.map()` en la query, y filtrar también el fallback local |

