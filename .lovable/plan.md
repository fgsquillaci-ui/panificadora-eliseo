

## Plan: Actualizar logo del header y rediseñar hero

### Cambios

**1. Reemplazar logo del header**
- Copiar la imagen subida (`ChatGPT_Image_18_mar_2026_06_07_58_p.m.-3.png`) a `src/assets/logo.png`
- El header ya importa desde `@/assets/logo.png`, solo ajustar tamaño si es necesario

**2. Restaurar hero con imagen de panes reales**
- Cambiar `src/assets/hero-bread.jpg` por una imagen atractiva de pan artesanal con trigo (usar la imagen original que tenía antes o una nueva)
- Reducir el hero de `h-screen` a `h-[70vh]` o `min-h-[60vh]` para que no ocupe toda la pantalla
- Agregar el logo centrado sobre el fondo de panes con efecto de integración (drop-shadow, glow dorado sutil)
- Mantener tagline "CALIDAD ARTESANAL" y texto descriptivo debajo
- CTA WhatsApp se mantiene

**3. Hero.tsx actualizado**
- Importar logo desde `@/assets/logo.png`
- Fondo: imagen de panes con overlay `bg-black/40`
- Logo centrado con `drop-shadow` y `mix-blend-mode` para integración
- Altura reducida: `h-[70vh]`

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/assets/logo.png` | Reemplazar con imagen subida |
| `src/assets/hero-bread.jpg` | Restaurar imagen de panes artesanales |
| `src/components/Hero.tsx` | Reducir altura, agregar logo centrado sobre fondo de panes |

