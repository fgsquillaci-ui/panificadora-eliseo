

## Agregar toggle de visibilidad de contraseña

Agregar un botón con ícono de ojo (Eye/EyeOff de lucide-react) dentro de los campos de contraseña en Login y Registro para alternar entre `type="password"` y `type="text"`.

### Archivos a modificar

1. **`src/pages/Login.tsx`**
   - Agregar estado `showPassword`
   - Wrappear el Input de contraseña en un `div relative`
   - Agregar botón con ícono Eye/EyeOff posicionado a la derecha del input

2. **`src/pages/Registro.tsx`**
   - Mismo cambio para el campo de contraseña

### UI
- Botón transparente con ícono `Eye` (mostrar) / `EyeOff` (ocultar) posicionado `absolute right-3 top-1/2 -translate-y-1/2`
- Click alterna el `type` del input entre `"password"` y `"text"`

