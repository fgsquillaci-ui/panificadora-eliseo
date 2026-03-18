

## Plan: Hero con logo integrado orgánicamente (efecto "impreso")

### Concepto
Usar la imagen subida como fondo completo del hero (ya contiene el logo, espigas de trigo y textura marrón). Eliminar el logo superpuesto y reemplazarlo con la imagen completa como background, logrando el efecto de "logo impreso en la escena". El texto descriptivo y el CTA flotan sutilmente sobre la imagen.

### Cambios

**1. Copiar imagen subida como nuevo hero background**
- `user-uploads://ChatGPT_Image_18_mar_2026_06_07_58_p.m.-3.png` → `src/assets/hero-bread.jpg`

**2. Rediseñar `src/components/Hero.tsx`**
- Hero `h-screen` full viewport
- Imagen de fondo con `object-cover` (la imagen YA incluye logo + espigas + tagline)
- Overlay mínimo: `bg-black/20` solo para legibilidad
- Eliminar el `<motion.img>` del logo separado (ya está en el fondo)
- Posicionar el texto descriptivo y CTA en la parte inferior del hero (`items-end pb-20`)
- Texto "Pan fresco todos los días, sin conservantes" en crema `#F4EDE4` con `opacity-90`
- Botón WhatsApp se mantiene debajo
- Animaciones fade-in suaves con framer-motion

### Resultado esperado
El logo se percibe como parte integral de la imagen, no como un elemento pegado. El usuario ve una composición visual unificada con la marca "impresa" en la escena.

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/assets/hero-bread.jpg` | Reemplazar con imagen subida (logo+trigo+textura) |
| `src/components/Hero.tsx` | Rediseño: fondo con logo integrado, texto y CTA abajo |

