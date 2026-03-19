

## Plan: Sistema de Pedido Mejorado por WhatsApp

### Resumen
Agregar un formulario de datos de entrega en el carrito (antes de enviar por WhatsApp) y actualizar el mensaje generado con el formato estructurado del PRD.

### Cambios

#### 1. Nuevo componente: `src/components/CheckoutForm.tsx`
Formulario dentro del drawer del carrito que aparece al presionar "Continuar al pedido":
- **Tipo de entrega**: Radio buttons — Delivery / Retiro en local
- **Si Delivery**: Campo dirección (obligatorio) + referencias (opcional)
- **Si Retiro**: Campo horario estimado (obligatorio)
- **Datos del cliente**: Nombre (obligatorio) + Teléfono (obligatorio)
- Si el usuario está logueado, pre-rellenar nombre y teléfono desde `profile`
- Botón "Enviar pedido por WhatsApp" solo se habilita cuando los campos obligatorios están completos

#### 2. Modificar `src/hooks/useCart.ts` — `getWhatsAppUrl`
Actualizar la función para aceptar datos del formulario y generar el mensaje con el nuevo formato:

```
Hola, quiero realizar el siguiente pedido:

🛒 Pedido:
- Pan Casero x20 ($24.000) [mayorista]

💰 Total: $24.000

📍 Entrega: Delivery / Retiro
[Dirección + referencias] o [Horario estimado]

👤 Nombre: ...
📞 Teléfono: ...

Gracias 🙌
```

Mantener lógica existente de descuento y precio mayorista.

#### 3. Modificar `src/components/Cart.tsx`
- Agregar estado de paso: `cart` → `checkout`
- En paso `cart`: mostrar productos + botón "Continuar"
- En paso `checkout`: mostrar `<CheckoutForm />` con botón de WhatsApp
- Botón "Volver" para regresar a la lista de productos

#### 4. Modificar `src/pages/Index.tsx`
Pasar `profile` al componente Cart para pre-rellenar datos del formulario.

### Archivos

| Archivo | Cambio |
|---|---|
| `src/components/CheckoutForm.tsx` | Nuevo: formulario de datos de entrega |
| `src/hooks/useCart.ts` | Actualizar `getWhatsAppUrl` con nuevo formato y datos de entrega |
| `src/components/Cart.tsx` | Agregar flujo de 2 pasos (carrito → checkout) |
| `src/pages/Index.tsx` | Pasar `profile` al componente Cart |

