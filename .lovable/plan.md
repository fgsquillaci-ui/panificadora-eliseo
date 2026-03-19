

## Plan: Autocompletar datos de cliente + Corregir precio ciabattas

### Cambios

#### 1. `src/data/products.ts` — Corregir ciabattas
- Cambiar descripción para aclarar que son 3 unidades
- Agregar `unit: "x3"` para que quede claro en el catálogo
- El precio de 3000 ya es correcto (es por 3 unidades), solo falta indicarlo

#### 2. `src/components/CheckoutForm.tsx` — Autocompletar datos del cliente registrado
- Ya pre-rellena nombre y teléfono desde `profile` (funciona correctamente)
- **No** pre-rellenar dirección — siempre se pide nueva (ya es así actualmente)
- Mejora: si el usuario está logueado, mostrar los campos de nombre y teléfono como **read-only** o pre-rellenados pero editables, con un indicador visual de que vienen del perfil

| Archivo | Cambio |
|---|---|
| `src/data/products.ts` | Agregar `unit: "x3"` a ciabattas y ajustar descripción |
| `src/components/CheckoutForm.tsx` | Confirmar que dirección nunca se pre-rellena (ya cumplido) |

