

## Ajuste de navegación para tablet

El viewport actual es 768px, que es exactamente el breakpoint `md:` donde la nav aparece. Con `gap-6` y `text-sm` los links pueden quedar apretados junto al logo y los botones de acción.

### Cambios en `src/components/Header.tsx` (línea 27)

Reducir el gap y tamaño de texto en tablet, escalando a desktop:

```
gap-6 → gap-3 md:gap-4 lg:gap-6
text-sm → text-xs lg:text-sm
```

Esto da más respiro entre los 3 links en tablet sin sobreponerse, y mantiene el estilo original en desktop.

### Archivo

| Archivo | Cambio |
|---------|--------|
| `src/components/Header.tsx` | Ajustar clases responsive del `<nav>` (línea 27) |

