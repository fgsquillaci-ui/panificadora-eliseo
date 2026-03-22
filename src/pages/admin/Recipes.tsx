import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRecipes } from "@/hooks/useRecipes";
import { useIngredients } from "@/hooks/useIngredients";
import { useProducts } from "@/hooks/useProducts";
import { Trash2, Plus } from "lucide-react";

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const Recipes = () => {
  const { data: products = [] } = useProducts();
  const { ingredients } = useIngredients();
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const { recipes, totalCost, addLine, removeLine, loading } = useRecipes(selectedProduct || undefined);

  const [newIngId, setNewIngId] = useState("");
  const [newQty, setNewQty] = useState("");

  const handleAdd = async () => {
    if (!newIngId || !newQty) return;
    await addLine(newIngId, parseFloat(newQty));
    setNewIngId("");
    setNewQty("");
  };

  const selectedP = products.find(p => p.id === selectedProduct);
  const usedIngIds = recipes.map(r => r.ingredient_id);
  const availableIngs = ingredients.filter(i => !usedIngIds.includes(i.id));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-heading font-bold text-foreground">Recetas</h1>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading">Seleccionar producto</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger><SelectValue placeholder="Elegí un producto" /></SelectTrigger>
              <SelectContent>
                {products.map(p => <SelectItem key={p.id} value={p.id}>{p.emoji} {p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedProduct && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-heading">
                  Receta: {selectedP?.emoji} {selectedP?.name}
                </CardTitle>
                <Badge variant="secondary">Costo: {fmt(totalCost)}</Badge>
              </div>
              {selectedP?.retail_price && (
                <p className="text-xs text-muted-foreground">
                  Precio venta: {fmt(selectedP.retail_price)} — Margen: {totalCost > 0 ? `${(((selectedP.retail_price - totalCost) / selectedP.retail_price) * 100).toFixed(1)}%` : "—"}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {recipes.length > 0 && (
                <div className="space-y-2">
                  {recipes.map(r => (
                    <div key={r.id} className="flex items-center justify-between border-b pb-2 text-sm">
                      <div>
                        <span className="font-body font-medium">{r.ingredient_name}</span>
                        <span className="text-muted-foreground ml-2">{r.quantity} {r.ingredient_unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{fmt(r.line_cost)}</span>
                        <Button size="sm" variant="ghost" onClick={() => removeLine(r.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {availableIngs.length > 0 && (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select value={newIngId} onValueChange={setNewIngId}>
                      <SelectTrigger><SelectValue placeholder="Ingrediente" /></SelectTrigger>
                      <SelectContent>
                        {availableIngs.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.unit})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input type="number" placeholder="Cant." className="w-24" value={newQty} onChange={e => setNewQty(e.target.value)} />
                  <Button size="sm" onClick={handleAdd}><Plus className="w-4 h-4" /></Button>
                </div>
              )}

              {availableIngs.length === 0 && ingredients.length > 0 && (
                <p className="text-xs text-muted-foreground">Todos los ingredientes ya están en la receta</p>
              )}
              {ingredients.length === 0 && (
                <p className="text-sm text-muted-foreground">Primero creá ingredientes en la sección Ingredientes</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Recipes;
