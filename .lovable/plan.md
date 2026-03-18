

## Plan: Nuevo hero con imagen de pan artesanal real

### Cambios

**1. Copiar imagen subida como fondo del hero**
- `user-uploads://freepik_varios-panes-rsticos-recin-horneados-sobre-mesa-de_44750.png` → `src/assets/hero-bread.jpg`

**2. Rediseñar `src/components/Hero.tsx`**
- Fondo: nueva imagen de panes con manos (full width, `object-cover`)
- Overlay sutil: `bg-black/20` (no más oscuro, para mantener textura real)
- Logo centrado con `opacity-90`, `mix-blend-screen`, y `drop-shadow` suave
- Tagline "CALIDAD ARTESANAL" en dorado `#D6B37A`
- Descripción en crema `rgba(244, 237, 228, 0.9)`
- Altura: `h-[70vh]` (mantener tamaño reducido como se pidió antes)
- Animaciones framer-motion conservadas
- CTA WhatsApp se mantiene

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/assets/hero-bread.jpg` | Reemplazar con imagen de panes subida |
| `src/components/Hero.tsx` | Actualizar fondo, ajustar overlay a bg-black/20, logo con mix-blend-screen y opacity-90 |

