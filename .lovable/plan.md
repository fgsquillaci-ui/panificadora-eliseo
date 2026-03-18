

## Plan: Reemplazar logo y adaptarlo a la web

### Cambios

1. **Copiar el nuevo logo** (`user-uploads://Logo_web.png`) a `src/assets/logo.png` (sobreescribe el actual).

2. **Header (`src/components/Header.tsx`)**: El logo ya se importa desde `@/assets/logo.png` y se muestra como imagen. Solo ajustar el tamaño si es necesario para que el nuevo logo (que es más horizontal/detallado) se vea bien en el header — aumentar altura a `h-14` o similar.

3. **Hero (`src/components/Hero.tsx`)**: Reemplazar el texto "Panificadora Eliseo" y el h1 con el logo como imagen central, manteniendo el subtítulo y CTA debajo. Esto replica la estética de la imagen subida donde el logo es protagonista sobre fondo oscuro.

4. **Footer (`src/components/Footer.tsx`)**: Ya usa el logo, ajustar tamaño si es necesario.

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/assets/logo.png` | Reemplazar con nuevo logo |
| `src/components/Hero.tsx` | Logo como elemento central en lugar de texto |
| `src/components/Header.tsx` | Ajustar tamaño del logo |

