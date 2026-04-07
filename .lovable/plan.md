

## Add delivery_date field to CreateOrderForm

### Changes — `src/components/CreateOrderForm.tsx`

**1. State (line 50)** — Add after `showConfirmation`:
```ts
const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
```

**2. Date input (line 291, between address and payment method)** — Insert:
```tsx
<div className="space-y-1.5">
  <Label className="font-body text-xs font-semibold">Fecha de entrega</Label>
  <Input
    type="date"
    value={deliveryDate}
    min={new Date().toISOString().split("T")[0]}
    onChange={(e) => setDeliveryDate(e.target.value)}
  />
</div>
```

**3. Payload (line 194)** — Add after `items,`:
```ts
delivery_date: deliveryDate || new Date().toISOString().split("T")[0],
```

**4. Confirmation screen (line 246, after address display, before payment method)** — Insert:
```tsx
<div className="space-y-1">
  <p className="font-body text-xs text-muted-foreground">Fecha de entrega</p>
  <p className="font-body text-sm">
    📅 {new Date(deliveryDate + "T12:00:00").toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}
  </p>
</div>
```

Note: `T12:00:00` prevents timezone offset issues that could shift the displayed date by one day.

### Files

| File | Change |
|---|---|
| `src/components/CreateOrderForm.tsx` | Add state, date input with `min`, safe payload, formatted confirmation display |

