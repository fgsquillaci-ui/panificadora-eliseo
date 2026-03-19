

## Plan: Sección "Quiénes Somos" + navegación actualizada

### Resumen
Crear una nueva sección "Quiénes Somos" que cuente la historia de Panificadora Eliseo y conecte emocionalmente con los clientes. Actualizar la navegación del header para mostrar los 3 links: Productos, Cómo funciona, Quiénes somos.

### Nuevo componente: `src/components/AboutUs.tsx`
Sección con:
- Título "Quiénes somos"
- Texto emotivo sobre la historia familiar/artesanal de la panificadora (tono rioplatense cercano)
- Valores: tradición, familia, calidad, compromiso con el barrio
- Diseño visual consistente con el resto (motion animations, misma paleta)

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/AboutUs.tsx` | Nuevo: sección "Quiénes Somos" con historia y valores |
| `src/components/Header.tsx` | Actualizar nav: Productos, Cómo funciona, Quiénes somos |
| `src/pages/Index.tsx` | Agregar `<AboutUs />` con `id="quienes-somos"` entre TrustSection y FinalCta |

