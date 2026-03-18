

## Plan: Rediseñar Hero con logo integrado orgánicamente

### Objetivo
Reemplazar el hero actual con un diseño premium donde el logo se fusione naturalmente con el fondo, siguiendo las directrices del PRD: sin cajas, sin tarjetas, logo integrado con el fondo mediante sombras y glow dorado.

### Cambios

**1. Copiar la nueva imagen como logo del hero**
- Copiar `user-uploads://ChatGPT_Image_18_mar_2026_06_07_58_p.m.-2.png` a `src/assets/logo.png` (reemplaza el actual)

**2. Rediseñar `src/components/Hero.tsx`**
- Hero `h-screen` (full viewport) en lugar de `min-h-[85vh]`
- Fondo: mantener `hero-bread.jpg` con overlay `bg-black/40` (marrón oscuro sutil)
- Logo centrado con `drop-shadow` fuerte y glow dorado sutil (`filter: drop-shadow(0 0 30px rgba(214,165,89,0.3))`)
- Logo más grande en mobile (`w-64`) y desktop (`w-80 md:w-96`)
- Agregar tagline "CALIDAD ARTESANAL" en dorado (`#D6B37A`) con `tracking-widest`
- Texto descriptivo en crema (`#F4EDE4`)
- Botón WhatsApp se mantiene igual (ya existe en el sistema)
- Animaciones framer-motion existentes se conservan

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/assets/logo.png` | Reemplazar con nuevo logo |
| `src/components/Hero.tsx` | Rediseño completo según PRD |

