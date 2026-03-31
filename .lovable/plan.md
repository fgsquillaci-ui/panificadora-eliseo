

## Reducir botones WhatsApp en móvil

### Cambios

**1. `src/components/Hero.tsx` (línea 60)**

Reducir padding y texto en móvil usando clases responsive:

- `text-lg` → `text-base md:text-lg`
- `px-10 py-4` → `px-7 py-3 md:px-10 md:py-4`

**2. `src/components/FinalCta.tsx` (línea 25)**

Mismo ajuste:

- `text-lg` → `text-base md:text-lg`
- `px-12 py-5` → `px-8 py-3.5 md:px-12 md:py-5`
- `gap-3` → `gap-2 md:gap-3`
- Icono: `w-6 h-6` → `w-5 h-5 md:w-6 md:h-6`

### Resultado

Los botones se ven más proporcionados en pantallas pequeñas (390px) sin afectar la versión desktop.

