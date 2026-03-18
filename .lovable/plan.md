

## Plan: Usar la imagen como fondo del Hero

La imagen subida es un diseño completo del hero (fondo marrón texturizado con espigas de trigo, logo centrado, subtítulo y CTA). La mejor forma de lograr armonía es usarla directamente como imagen de fondo del hero, reemplazando la foto de pan actual (`hero-bread.jpg`).

### Cambios

1. **Copiar la imagen** a `src/assets/hero-bread.jpg` (reemplaza el fondo actual del hero).

2. **Ajustar `src/components/Hero.tsx`**:
   - Usar la nueva imagen como fondo a pantalla completa con `object-cover`
   - Reducir o eliminar el overlay de gradiente oscuro, ya que la imagen tiene su propio fondo marrón texturizado que no necesita oscurecerse tanto
   - Mantener el logo, subtítulo y botón CTA superpuestos pero con opacidad/sombras que se integren naturalmente con el fondo marrón
   - Ajustar el gradiente a tonos marrones coherentes con la imagen (en lugar del overlay genérico actual)

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/assets/hero-bread.jpg` | Reemplazar con la nueva imagen |
| `src/components/Hero.tsx` | Ajustar overlay y composición para armonizar con el nuevo fondo |

