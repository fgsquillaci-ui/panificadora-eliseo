

## Crear pedidos de prueba para revendedores y delivery

### Datos disponibles

- **Revendedor 1**: `b0b8da90-1dd9-4889-b368-e20ec7e69129`
- **Revendedor 2**: `faece87a-5485-4357-9a24-3434c3b2fcd3`
- **Delivery 1**: `43d18d95-a8ec-4317-b15e-a6856f681945`

### Acciones

#### 1. Insertar 6 pedidos en `orders`
- 3 pedidos del Revendedor 1 (distintos estados: pendiente, en_produccion, enviado)
- 3 pedidos del Revendedor 2 (distintos estados: pendiente, enviado, entregado)
- Todos con `delivery_type = 'delivery'`, direcciones y datos de contacto ficticios

#### 2. Insertar items en `order_items`
- 2-3 productos por pedido usando productos existentes (Pan Casero, Ciabattas, Focaccia, etc.)

#### 3. Insertar asignaciones en `deliveries`
- Asignar los 4 pedidos con estado `enviado` o `en_produccion` al Delivery 1
- Con estados `asignado` para los pendientes de entrega y `entregado` para el ya entregado

### Resultado
- El **Revendedor 1** verá 3 pedidos en su dashboard con distintos estados
- El **Revendedor 2** verá 3 pedidos en su dashboard
- El **Delivery 1** verá las entregas asignadas en su panel
- El **Admin** verá todos los pedidos en `/admin/pedidos`

No se requieren cambios de código ni migraciones de esquema, solo inserción de datos.

