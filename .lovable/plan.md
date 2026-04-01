## Ajustar video Hero para mostrar más escena

### Problema

`object-cover` recorta el video para llenar todo el contenedor, ocultando partes de la escena.

### Solución

Cambiar `object-cover` a `object-contain` en el `<video>` (línea 15), y agregar un fondo claro (mismo color de la pagina) al contenedor del video para que los bordes laterales no queden blancos.

```
object-cover → object-contain
```

Agregar `bg-black` al `<div>` contenedor (línea 9) para que el espacio no cubierto por el video sea del color de la pagina principal, integrándose con el overlay.

### Archivo


| Archivo                   | Cambio                                                              |
| ------------------------- | ------------------------------------------------------------------- |
| `src/components/Hero.tsx` | `object-cover` → `object-contain`, agregar `bg-black` al contenedor |
