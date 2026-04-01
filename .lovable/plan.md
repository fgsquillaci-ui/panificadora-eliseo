

## Reemplazar imagen Hero por video de fondo

### Cambios

**1. Copiar video al proyecto**

`user-uploads://video_portada.mp4` → `public/video/video_portada.mp4`

Se usa `public/` porque los videos como fondo se referencian mejor con URL directa (evita problemas de bundling con archivos grandes).

**2. Modificar `src/components/Hero.tsx`**

- Reemplazar el `<img>` (líneas 10-13) por un `<video>` con `autoPlay`, `muted`, `loop`, `playsInline` y `object-cover`
- Eliminar el import de `heroBread` (línea 2, ya no se usa)
- Mantener el overlay oscuro (`bg-black/20`) y todo el contenido (logo, textos, botón CTA) sin cambios

```tsx
<video
  autoPlay
  muted
  loop
  playsInline
  className="w-full h-full object-cover"
  src="/video/video_portada.mp4"
/>
```

### Archivos

| Acción | Archivo |
|--------|---------|
| Copiar | `public/video/video_portada.mp4` |
| Editar | `src/components/Hero.tsx` |

