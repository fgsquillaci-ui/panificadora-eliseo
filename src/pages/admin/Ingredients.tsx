import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIngredients, type Ingredient } from "@/hooks/useIngredients";
import { Plus, Pencil, Trash2 } from "lucide-react";

const units = ["kg", "g", "litro", "ml", "unidad"];

const Ingredients = () => {
  const { ingredients, loading, create, update, remove } = useIngredients();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form, setForm] = useState({ name: "", unit: "kg", stock_actual: "", stock_minimo: "", costo_unitario: "" });

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

  const stockColor = (i: Ingredient) => {
    if (i.stock_minimo <= 0) return "default";
    if (i.stock_actual <= i.stock_minimo * 0.5) return "destructive";
    if (i.stock_actual <= i.stock_minimo) return "secondary";
    return "default";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-heading font-bold text-foreground">Ingredientes</h1>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Ingrediente</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar" : "Nuevo"} ingrediente</DialogTitle></DialogHeader>
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
          <p className="text-muted-foreground">No hay ingredientes. Creá el primero.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ingredients.map(i => (
              <Card key={i.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">{i.name}</h3>
                      <p className="text-xs text-muted-foreground">${(i.costo_unitario / 100).toFixed(2)} / {i.unit}</p>
                    </div>
                    <Badge variant={stockColor(i)}>{i.stock_actual} {i.unit}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Mín: {i.stock_minimo} {i.unit}</p>
                  <div className="flex gap-1">
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
