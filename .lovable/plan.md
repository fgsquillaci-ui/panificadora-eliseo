

## Pricing unificado + Pagos + Correcciones financieras

### Diagnostico

| Problema | Detalle |
|----------|---------|
| Pricing inconsistente | Web publica usa `getEffectivePrice` (mayorista por cantidad). `CreateOrderForm` usa `product.price` siempre (solo minorista). |
| Sin tipo de precio en clientes | No existe `price_type` en `customers`. Un cliente mayorista paga minorista en admin. |
| Sin metodo de pago | No existe `payment_method` en `orders`. |
| Finanzas | Ya usa `orders.total` de entregados correctamente. No hay bug real ahi. |

### 1. Migracion de base de datos

```sql
-- Agregar price_type a customers
ALTER TABLE customers ADD COLUMN price_type text NOT NULL DEFAULT 'minorista';

-- Agregar payment_method a orders
ALTER TABLE orders ADD COLUMN payment_method text NOT NULL DEFAULT 'efectivo';
```

### 2. Funcion unica de pricing: `getUnitPrice`

Crear `src/lib/pricing.ts` con una funcion reutilizable:

```text
getUnitPrice(product, quantity, customerPriceType)
  SI customerPriceType === "mayorista" → product.wholesalePrice || product.price
  SI customerPriceType === "intermedio" → product.intermediatePrice || product.price  
  SI customerPriceType === "minorista":
    SI quantity >= 10 && product.wholesalePrice → product.wholesalePrice
    SINO → product.price
```

Esta funcion reemplaza a `getEffectivePrice` en TODOS los contextos.

### 3. Agregar `intermediate_price` a productos (DB + types)

La tabla `products` ya tiene `retail_price` y `wholesale_price`. Agregar:

```sql
ALTER TABLE products ADD COLUMN intermediate_price integer;
```

### 4. Actualizar `useProducts` y tipo `Product`

- Agregar `intermediatePrice` al tipo `Product`
- Mapear `intermediate_price` de la DB

### 5. Actualizar `CustomerPicker`

- Retornar `price_type` del cliente seleccionado
- Actualizar interfaz `SelectedCustomer` para incluir `price_type`

### 6. Actualizar `CreateOrderForm`

- Usar `getUnitPrice` al agregar productos al carrito (recalcular precio segun cliente)
- Cuando se selecciona cliente, recalcular precios del carrito existente
- Agregar selector obligatorio de metodo de pago (efectivo/transferencia/tarjeta)
- Bloquear envio sin metodo de pago
- Guardar `payment_method` en el insert de `orders`
- Mostrar metodo de pago en pantalla de confirmacion

### 7. Actualizar web publica (`useCart` + `ProductCatalog`)

- Reemplazar `getEffectivePrice` por `getUnitPrice` con `price_type = "minorista"` (default para web)
- Misma logica: >= 10 unidades = mayorista

### 8. Actualizar `CustomerPicker` dialog de creacion

- Agregar selector de `price_type` (minorista/intermedio/mayorista) al crear cliente nuevo
- Guardar en DB

### 9. Actualizar admin `Customers.tsx`

- Mostrar `price_type` en lista de clientes
- Permitir editarlo

### Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| Migracion SQL | `price_type` en customers, `payment_method` en orders, `intermediate_price` en products |
| `src/lib/pricing.ts` | Nuevo — funcion `getUnitPrice` |
| `src/data/products.ts` | Actualizar tipo `Product` con `intermediatePrice`, reemplazar `getEffectivePrice` |
| `src/hooks/useProducts.ts` | Mapear `intermediate_price` |
| `src/components/CustomerPicker.tsx` | Retornar `price_type`, permitir seleccionarlo al crear |
| `src/components/CreateOrderForm.tsx` | Usar `getUnitPrice`, agregar `payment_method` obligatorio |
| `src/hooks/useCart.ts` | Usar `getUnitPrice` en lugar de `getEffectivePrice` |
| `src/pages/admin/Customers.tsx` | Mostrar y editar `price_type` |

### Lo que NO se modifica

- OwnerDashboard (finanzas ya usa orders.total correctamente)
- Estructura de order_items
- Delivery dashboard
- Edge functions
- RLS policies existentes

