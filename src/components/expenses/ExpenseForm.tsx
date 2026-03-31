import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIngredients } from "@/hooks/useIngredients";
import { CATEGORIES } from "@/hooks/useExpenses";
import { formatCurrency } from "@/utils/currency";
import { AlertTriangle } from "lucide-react";

interface ExpenseFormProps {
  onSubmit: (data: Record<string, unknown>) => Promise<boolean>;
  initialData?: Record<string, any>;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
];

export default function ExpenseForm({ onSubmit, initialData, onClose }: ExpenseFormProps) {
  const { ingredients } = useIngredients();
  const [category, setCategory] = useState(initialData?.category || "otros");
  const [description, setDescription] = useState(initialData?.description || "");
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || "efectivo");
  const [supplier, setSupplier] = useState(initialData?.supplier || "");
  const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
  const [ingredientId, setIngredientId] = useState(initialData?.ingredient_id || "");
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || "");
  const [unitPrice, setUnitPrice] = useState(initialData?.unit_price?.toString() || "");
  const [submitting, setSubmitting] = useState(false);

  const isMateriaPrima = category === "materia_prima";
  const computedAmount = isMateriaPrima ? (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0) : 0;

  const isValid = isMateriaPrima
    ? !!ingredientId && parseFloat(quantity) > 0 && parseFloat(unitPrice) > 0
    : parseFloat(amount) > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      category,
      description,
      date,
      payment_method: paymentMethod,
      supplier,
    };

    if (isMateriaPrima) {
      payload.ingredient_id = ingredientId;
      payload.quantity = parseFloat(quantity);
      payload.unit_price = parseFloat(unitPrice);
    } else {
      payload.amount = parseFloat(amount);
    }

    const ok = await onSubmit(payload);
    setSubmitting(false);
    if (ok) onClose();
  };

  const selectedIngredient = ingredients.find(i => i.id === ingredientId);

  return (
    <div className="space-y-4">
      {/* Category */}
      <div className="space-y-1.5">
        <Label>Categoría</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Descripción</Label>
        <Input placeholder="Descripción del gasto" value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label>Fecha</Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      {/* Payment method */}
      <div className="space-y-1.5">
        <Label>Método de pago</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Supplier */}
      <div className="space-y-1.5">
        <Label>Proveedor (opcional)</Label>
        <Input placeholder="Nombre del proveedor" value={supplier} onChange={e => setSupplier(e.target.value)} />
      </div>

      {/* Materia prima fields */}
      {isMateriaPrima ? (
        <>
          <div className="space-y-1.5">
            <Label>Ingrediente</Label>
            <Select value={ingredientId} onValueChange={setIngredientId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar ingrediente" /></SelectTrigger>
              <SelectContent>
                {ingredients.map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!ingredientId && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Seleccioná un ingrediente
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cantidad {selectedIngredient ? `(${selectedIngredient.unit})` : ""}</Label>
              <Input type="number" placeholder="Ej: 25" value={quantity} onChange={e => setQuantity(e.target.value)} min="0" step="any" />
            </div>
            <div className="space-y-1.5">
              <Label>Precio unitario ($)</Label>
              <Input type="number" placeholder="Ej: 680" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} min="0" step="any" />
            </div>
          </div>

          {computedAmount > 0 && (
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Total calculado</p>
              <p className="text-lg font-heading font-bold text-foreground">{formatCurrency(computedAmount)}</p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-1.5">
          <Label>Monto ($)</Label>
          <Input type="number" placeholder="Monto del gasto" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="any" />
        </div>
      )}

      <Button onClick={handleSubmit} disabled={!isValid || submitting} className="w-full">
        {submitting ? "Registrando..." : initialData ? "Actualizar gasto" : "Registrar gasto"}
      </Button>
    </div>
  );
}
