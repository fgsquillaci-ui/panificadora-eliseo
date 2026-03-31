import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIngredients, type Ingredient } from "@/hooks/useIngredients";
import { usePurchases, type Purchase } from "@/hooks/usePurchases";
import { Plus, Pencil, Trash2, ShoppingCart, TrendingUp, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/utils/currency";

const units = ["kg", "g", "litro", "ml", "unidad"];
const fmt = formatCurrency;

const Ingredients = () => {
  const { ingredients, loading, create, update, remove } = useIngredients();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form, setForm] = useState({ name: "", unit: "kg", stock_actual: "", stock_minimo: "", costo_unitario: "" });

  // Purchase view
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ quantity: "", unit_price: "", date: new Date().toISOString().slice(0, 10) });
  const { purchases, weightedAvgCost, create: createPurchase, remove: removePurchase } = usePurchases(selectedIngredient?.id);

  const resetForm = () => { setForm({ name: "", unit: "kg", stock_actual: "", stock_minimo: "", costo_unitario: "" }); setEditing(null); };

  const openEdit = (i: Ingredient) => {
    setEditing(i);
    setForm({ name: i.name, unit: i.unit, stock_actual: String(i.stock_actual), stock_minimo: String(i.stock_minimo), costo_unitario: String(i.costo_unitario / 100) });
    setOpen(true);
  };

  const handleSubmit = async () => {
    const values = {
      name: form.name,
      unit: form.unit,
      stock_actual: parseFloat(form.stock_actual) || 0,
      stock_minimo: parseFloat(form.stock_minimo) || 0,
      costo_unitario: Math.round((parseFloat(form.costo_unitario) || 0) * 100),
    };
    if (!values.name) return;
    const ok = editing ? await update(editing.id, values) : await create(values);
    if (ok) { setOpen(false); resetForm(); }
  };

  const handlePurchase = async () => {
    if (!selectedIngredient) return;
    const quantity = parseFloat(purchaseForm.quantity);
    const unit_price = Math.round((parseFloat(purchaseForm.unit_price) || 0) * 100);
    if (!quantity || !unit_price) return;
    const ok = await createPurchase({ ingredient_id: selectedIngredient.id, quantity, unit_price, date: purchaseForm.date });
    if (ok) { setPurchaseOpen(false); setPurchaseForm({ quantity: "", unit_price: "", date: new Date().toISOString().slice(0, 10) }); }
  };

  const stockColor = (i: Ingredient) => {
    if (i.stock_minimo <= 0) return "default" as const;
    if (i.stock_actual <= i.stock_minimo * 0.5) return "destructive" as const;
    if (i.stock_actual <= i.stock_minimo) return "secondary" as const;
    return "default" as const;
  };

  // Detail view for a single ingredient
  if (selectedIngredient) {
    const costDiff = weightedAvgCost > 0 ? ((weightedAvgCost - selectedIngredient.costo_unitario) / selectedIngredient.costo_unitario * 100) : 0;
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIngredient(null)}><ArrowLeft className="w-4 h-4 mr-1" /> Volver</Button>
            <h1 className="text-2xl font-heading font-bold text-foreground">{selectedIngredient.name}</h1>
          </div>

          {/* Cost comparison */}
          <div className="grid sm:grid-cols-3 gap-3">
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Costo actual</p>
              <p className="text-xl font-heading font-bold text-foreground">{fmt(selectedIngredient.costo_unitario / 100)} / {selectedIngredient.unit}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Costo promedio (compras)</p>
              <p className="text-xl font-heading font-bold text-foreground">{weightedAvgCost > 0 ? `${fmt(weightedAvgCost / 100)} / ${selectedIngredient.unit}` : "Sin compras"}</p>
            </CardContent></Card>
            {weightedAvgCost > 0 && (
              <Card><CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Diferencia</p>
                <p className={`text-xl font-heading font-bold ${Math.abs(costDiff) > 15 ? "text-destructive" : "text-foreground"}`}>
                  {costDiff > 0 ? "+" : ""}{costDiff.toFixed(1)}%
                </p>
                {Math.abs(costDiff) > 15 && (
                  <Button size="sm" className="mt-2" onClick={async () => {
                    await update(selectedIngredient.id, { costo_unitario: weightedAvgCost });
                    setSelectedIngredient({ ...selectedIngredient, costo_unitario: weightedAvgCost });
                  }}>
                    <TrendingUp className="w-3 h-3 mr-1" /> Actualizar costo
                  </Button>
                )}
              </CardContent></Card>
            )}
          </div>

          {/* Purchases */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-heading">Historial de compras</CardTitle>
              <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}>
                <DialogTrigger asChild><Button size="sm"><ShoppingCart className="w-3 h-3 mr-1" /> Registrar compra</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nueva compra — {selectedIngredient.name}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input type="number" placeholder={`Cantidad (${selectedIngredient.unit})`} value={purchaseForm.quantity} onChange={e => setPurchaseForm(f => ({ ...f, quantity: e.target.value }))} />
                    <Input type="number" placeholder={`Precio por ${selectedIngredient.unit} ($)`} value={purchaseForm.unit_price} onChange={e => setPurchaseForm(f => ({ ...f, unit_price: e.target.value }))} />
                    <Input type="date" value={purchaseForm.date} onChange={e => setPurchaseForm(f => ({ ...f, date: e.target.value }))} />
                    <Button onClick={handlePurchase} className="w-full">Registrar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? <p className="text-sm text-muted-foreground">Sin compras registradas</p> : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {purchases.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm border-b pb-2">
                      <div>
                        <span className="font-body">{p.quantity} {selectedIngredient.unit} × {fmt(p.unit_price / 100)}</span>
                        <span className="text-xs text-muted-foreground ml-2">{p.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{fmt(p.total_cost)}</span>
                        <Button size="sm" variant="ghost" onClick={() => removePurchase(p.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-foreground">Materia Prima</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nuevo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} materia prima</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Stock actual" value={form.stock_actual} onChange={e => setForm(f => ({ ...f, stock_actual: e.target.value }))} />
                  <Input type="number" placeholder="Stock mínimo" value={form.stock_minimo} onChange={e => setForm(f => ({ ...f, stock_minimo: e.target.value }))} />
                </div>
                <Input type="number" placeholder="Costo por unidad ($)" value={form.costo_unitario} onChange={e => setForm(f => ({ ...f, costo_unitario: e.target.value }))} />
                <Button onClick={handleSubmit} className="w-full">{editing ? "Guardar" : "Crear"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? <p className="text-muted-foreground">Cargando...</p> : ingredients.length === 0 ? (
          <p className="text-muted-foreground">No hay materia prima. Creá la primera.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ingredients.map(i => (
              <Card key={i.id} className="cursor-pointer hover:border-accent/50 transition-colors" onClick={() => setSelectedIngredient(i)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">{i.name}</h3>
                      <p className="text-xs text-muted-foreground">{fmt(i.costo_unitario / 100)} / {i.unit}</p>
                    </div>
                    <Badge variant={stockColor(i)}>{i.stock_actual} {i.unit}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Mín: {i.stock_minimo} {i.unit}</p>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => openEdit(i)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => remove(i.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Ingredients;
