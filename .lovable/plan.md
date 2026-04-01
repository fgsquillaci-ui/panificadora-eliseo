

## Reemplazar emoji de Ciabattas por foto real

El producto "Ciabattas" actualmente muestra un emoji (🥖) como imagen. Vamos a reemplazarlo por la foto subida.

### Enfoque

Como la tabla `products` no tiene columna de imagen, y este es el primer producto con foto real, el enfoque más simple es:

1. **Copiar la imagen** `user-uploads://Ciabatta.jpeg` → `src/assets/products/ciabatta.jpg`
2. **Modificar `ProductCatalog.tsx`**: crear un mapa de imágenes por `product.id`, y si existe imagen para ese producto, mostrar `<img>` en lugar del emoji

```tsx
import ciabattaImg from "@/assets/products/ciabatta.jpg";

const productImages: Record<string, string> = {
  ciabattas: ciabattaImg,
};
```

En el render, reemplazar el bloque del emoji (línea 74-77):

```tsx
<div className="h-40 bg-secondary flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
  {productImages[product.id] ? (
    <img src={productImages[product.id]} alt={product.name} className="w-full h-full object-cover" />
  ) : (
    <span className="text-6xl">{product.emoji}</span>
  )}
</div>
```

### Archivos

| Acción | Archivo |
|--------|---------|
| Crear | `src/assets/products/ciabatta.jpg` |
| Editar | `src/components/ProductCatalog.tsx` |

Esto es extensible: a medida que se suban más fotos, solo se agregan al mapa `productImages`.

