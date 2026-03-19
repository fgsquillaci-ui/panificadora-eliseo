

## Diagnóstico: Dashboard no funciona por falta de contexto compartido de autenticación

### Problema raíz

`useAuth` no usa React Context -- cada componente que lo llama crea su propio estado independiente. Cuando Login navega a `/admin`, el `ProtectedRoute` crea una nueva instancia de `useAuth` que arranca con `user=null, loading=true`. Hay una condicion de carrera donde `loading` pasa a `false` antes de que el usuario se establezca, causando que `ProtectedRoute` redirija a `/login` o `/`.

Esto tambien explica las multiples llamadas repetidas a `profiles` y `user_roles` que se ven en las network requests (cada componente hace sus propias llamadas).

### Solucion

Convertir `useAuth` en un **Context Provider** para que todas las paginas y componentes compartan el mismo estado de autenticacion.

### Cambios

#### 1. Crear `src/contexts/AuthContext.tsx`
- Crear un `AuthProvider` con React Context que encapsule toda la logica actual de `useAuth`
- Exportar un hook `useAuth()` que lee del contexto
- El estado de `user`, `profile`, `loading` se inicializa una sola vez en el provider

#### 2. Modificar `src/hooks/useAuth.ts`
- Reexportar el hook desde el nuevo contexto para mantener compatibilidad con todos los imports existentes

#### 3. Modificar `src/App.tsx`
- Envolver todo con `<AuthProvider>` para que Login, ProtectedRoute, Index, y dashboards compartan el mismo estado

#### 4. Sin cambios en los demas archivos
- Todos los imports de `useAuth` siguen funcionando igual
- `ProtectedRoute`, `DashboardLayout`, `Login`, `Index`, etc. no necesitan cambios

### Resultado esperado
- Login redirige correctamente a `/admin`, `/revendedor`, o `/delivery`
- ProtectedRoute no redirige a "/" por race condition
- Se eliminan las llamadas duplicadas a profiles/user_roles

