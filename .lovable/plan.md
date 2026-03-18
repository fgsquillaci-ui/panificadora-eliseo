

## Plan: Ajustar paleta de colores, logo y fix de WhatsApp en desktop

### 1. Incorporar el logo
- Copiar la imagen del logo subida a `src/assets/logo.png`
- Usar el logo en el Header (reemplazando el texto "Panificadora Eliseo") y en el Footer

### 2. Actualizar paleta de colores
Basado en la imagen, los colores de marca son:
- **Dorado principal**: #D6A559
- **Dorado claro**: #DDA559
- **Crema/beige**: #F1EADC
- **Marrón oscuro**: #3E2723 (o similar)

Actualizar las CSS variables en `src/index.css`:
- `--background`: crema #F1EADC
- `--foreground` / `--primary`: marrón oscuro
- `--accent`: dorado #D6A559
- `--secondary`, `--border`, `--muted`: tonos intermedios derivados

### 3. Fix WhatsApp en desktop
El problema es que `wa.me` a veces no abre en desktop. Cambiar todos los enlaces de `https://wa.me/...` a `https://api.whatsapp.com/send?phone=...&text=...` que funciona mejor en navegadores de escritorio (redirige a WhatsApp Web si no hay app instalada).

Archivos afectados:
- `src/hooks/useCart.ts` (función `getWhatsAppUrl`)
- `src/components/FinalCta.tsx`
- `src/components/Footer.tsx`
- `src/components/Hero.tsx` (el CTA del hero baja al catálogo, no usa WhatsApp directo, OK)

### Resumen de archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/index.css` | Nuevas variables de color |
| `tailwind.config.ts` | Ajustar si es necesario |
| `src/components/Header.tsx` | Logo imagen en lugar de texto |
| `src/components/Footer.tsx` | Logo + URL WhatsApp |
| `src/components/FinalCta.tsx` | URL WhatsApp |
| `src/hooks/useCart.ts` | URL WhatsApp |
| `src/assets/logo.png` | Copiar archivo |

