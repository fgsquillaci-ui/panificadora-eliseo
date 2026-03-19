

## Limpiar registros de pedidos

Voy a eliminar todos los datos de las tablas relacionadas con pedidos para dejar los dashboards limpios.

### Operacion

Ejecutar DELETE en este orden (por dependencias de foreign keys):

1. `DELETE FROM order_items` — eliminar items de pedidos
2. `DELETE FROM deliveries` — eliminar asignaciones de entregas
3. `DELETE FROM orders` — eliminar todos los pedidos

### Resultado

- Los 3 dashboards (admin, revendedor, delivery) quedaran vacios y listos para usar
- No se modifica ninguna tabla de productos, usuarios ni perfiles
- No se cambia estructura de base de datos, solo se borran datos

