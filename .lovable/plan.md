

## Plan: Registro opcional de clientes + pedidos sin cuenta

### Resumen
Agregar un sistema de registro/login simple y opcional. Los usuarios pueden hacer pedidos sin registrarse (como funciona ahora via WhatsApp). Si se registran, se les puede asignar descuentos especiales visibles en su carrito.

### Flujo de usuario

```text
┌─────────────────────────────────────────┐
│  Usuario llega a la web                 │
│  ↓                                      │
│  Ve productos, arma pedido (sin login)  │
│  ↓                                      │
│  Al enviar pedido por WhatsApp:         │
│  ┌──────────────┬──────────────────┐    │
│  │ Sin cuenta   │ Con cuenta       │    │
│  │ → WhatsApp   │ → WhatsApp +     │    │
│  │   directo    │   nombre/datos   │    │
│  │              │   + descuento    │    │
│  └──────────────┴──────────────────┘    │
└─────────────────────────────────────────┘
```

### Cambios

**1. Base de datos** (migración)
- Tabla `profiles`: id (FK auth.users), name, phone, discount_percent (default 0), created_at
- RLS: cada usuario lee/actualiza solo su perfil
- Trigger: auto-crear perfil al registrarse

**2. Configuración de auth**
- Habilitar auto-confirm de email para simplificar el registro (público general, no técnico)

**3. Nuevas páginas y componentes**
- **`/login`** — Página simple con formulario de email + contraseña, y link a registro. Texto claro: "Si ya tenés cuenta, ingresá acá"
- **`/registro`** — Formulario: nombre, teléfono, email, contraseña. Texto: "Registrate para recibir descuentos especiales"
- **Botón en Header** — Icono de usuario: si no está logueado muestra "Ingresar", si está logueado muestra nombre y opción de cerrar sesión
- **Banner informativo** — Pequeño banner en el catálogo: "¿Querés descuentos especiales? Registrate gratis" con link

**4. Integración con el carrito**
- Hook `useAuth` para manejar sesión
- Si el usuario está logueado y tiene `discount_percent > 0`, aplicar descuento al total en el carrito
- Mostrar badge "Descuento cliente: X%" en el carrito
- En el mensaje de WhatsApp, incluir nombre del cliente registrado

**5. Textos claros y accesibles**
- Toda la UI en español, con instrucciones paso a paso
- Botones grandes y legibles
- Mensaje claro: "No necesitás registrarte para pedir. Pero si te registrás, podés acceder a precios especiales."

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| DB migration | Tabla `profiles` + trigger + RLS |
| `src/hooks/useAuth.ts` | Nuevo: manejo de sesión y perfil |
| `src/pages/Login.tsx` | Nueva página de login |
| `src/pages/Registro.tsx` | Nueva página de registro |
| `src/components/Header.tsx` | Agregar botón usuario/login |
| `src/components/Cart.tsx` | Mostrar descuento si aplica |
| `src/hooks/useCart.ts` | Aplicar descuento del perfil |
| `src/App.tsx` | Agregar rutas /login y /registro |
| `src/components/ProductCatalog.tsx` | Banner de registro opcional |

