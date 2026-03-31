

## Smart Pricing Logic — Business-Oriented Fix

### Changes in `src/pages/admin/OwnerDashboard.tsx`

**1. Rename column header (line 272)**
- `"Precio sugerido"` → `"Precio mínimo"`

**2. Smart suggestion logic (lines 289-296)**

Replace the current "always show suggested price + Aplicar button" with conditional logic:

- **If `price >= suggestedPrice`**: Show `✔ Precio saludable` in green. No action button.
- **If `price < suggestedPrice`**: Show the minimum price value + `⚠` warning. Show "Aplicar" button to raise price to minimum.
- **If `price` is null**: Show minimum price as reference, no action.

**3. Never suggest lowering price**

The "Aplicar" button currently appears when `Math.abs(price - suggestedPrice) > 50`, which includes cases where `suggestedPrice < price`. Change condition to only show when `price < suggestedPrice - 50`.

### Implementation Detail

Replace lines 289-296 with:
```tsx
<td className="py-2 text-right">
  {p.price !== null && p.price >= p.suggestedPrice ? (
    <span className="text-green-600 text-sm font-medium">✔ Saludable</span>
  ) : (
    <span className="text-orange-600 font-semibold">{fmt(p.suggestedPrice)}</span>
  )}
</td>
<td className="py-2 text-right">
  {p.price !== null && p.price < p.suggestedPrice - 50 && (
    <Button size="sm" variant="outline" onClick={() => applySuggestedPrice(p.id, p.suggestedPrice)}>
      Aplicar
    </Button>
  )}
</td>
```

### Files

| File | Change |
|------|--------|
| `src/pages/admin/OwnerDashboard.tsx` | Rename header, smart conditional display, remove downward suggestions |

### Unchanged
- Formula (`cost / (1 - target_margin)`) stays the same
- `applySuggestedPrice` function unchanged
- All other financial logic untouched

