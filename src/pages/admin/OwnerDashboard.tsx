import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFinancialData, type Period } from "@/hooks/useFinancialData";
import { useProductProfitability } from "@/hooks/useProductProfitability";
import { useIngredients } from "@/hooks/useIngredients";
import { usePurchases } from "@/hooks/usePurchases";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Plus, Percent, Wallet, BarChart3, RefreshCw } from "lucide-react";

const fmt = (cents: number) => `$${(cents / 100).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`;

const OwnerDashboard = () => {
  const [period, setPeriod] = useState<Period>("hoy");
  const { revenue, expenses, expensesList, cashMovements, totalWithdrawals, loading } = useFinancialData(period);
  const { products, estimatedCost, loading: profitLoading } = useProductProfitability(period);
  const { ingredients, lowStock, update: updateIngredient } = useIngredients();
  const { purchases: allPurchases } = usePurchases();

  const profit = revenue - estimatedCost - expenses;
  const margin = revenue > 0 ? ((revenue - estimatedCost) / revenue) * 100 : 0;
  const available = Math.max(0, profit - totalWithdrawals);

  // Alerts
  const lowMarginProducts = products.filter(p => p.hasRecipe && p.margin < 20 && p.margin >= 0);
  const highExpenses = revenue > 0 && expenses > revenue * 0.5;

  // Expense form
  const [expOpen, setExpOpen] = useState(false);
  const [expForm, setExpForm] = useState({ type: "otro", description: "", amount: "" });
  const handleExpense = async () => {
    const amt = Math.round(parseFloat(expForm.amount) * 100);
    if (!amt || !expForm.description) { toast.error("Completá todos los campos"); return; }
    await supabase.from("expenses").insert({ type: expForm.type, description: expForm.description, amount: amt });
    setExpForm({ type: "otro", description: "", amount: "" });
    setExpOpen(false);
    toast.success("Gasto registrado");
  };

  // Cash movement form
  const [cashOpen, setCashOpen] = useState(false);
  const [cashForm, setCashForm] = useState({ type: "ingreso", description: "", amount: "" });
  const handleCash = async () => {
    const amt = Math.round(parseFloat(cashForm.amount) * 100);
    if (!amt || !cashForm.description) { toast.error("Completá todos los campos"); return; }
    if (cashForm.type === "retiro" && amt > available) {
      toast.error("El retiro supera el dinero disponible");
      return;
    }
    await supabase.from("cash_movements").insert({ type: cashForm.type, description: cashForm.description, amount: amt });
    setCashForm({ type: "ingreso", description: "", amount: "" });
    setCashOpen(false);
    toast.success("Movimiento registrado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-heading font-bold text-foreground">Panel Financiero</h1>
          <div className="flex gap-1 bg-secondary rounded-lg p-1">
            {(["hoy", "semana", "mes"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-colors ${period === p ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard label="Ingresos" value={fmt(revenue)} icon={<DollarSign className="w-4 h-4" />} color="text-green-600" />
          <KpiCard label="Costos est." value={fmt(estimatedCost + expenses)} icon={<TrendingDown className="w-4 h-4" />} color="text-orange-500" />
          <KpiCard label="Ganancia" value={fmt(profit)} icon={<TrendingUp className="w-4 h-4" />} color={profit >= 0 ? "text-green-600" : "text-destructive"} />
          <KpiCard label="Margen" value={`${margin.toFixed(1)}%`} icon={<Percent className="w-4 h-4" />} color={margin >= 30 ? "text-green-600" : margin >= 15 ? "text-yellow-600" : "text-destructive"} />
          <KpiCard label="Disponible" value={fmt(available)} icon={<Wallet className="w-4 h-4" />} color="text-green-600" />
        </div>

        {/* Alerts */}
        {(lowStock.length > 0 || lowMarginProducts.length > 0 || highExpenses) && (
          <div className="grid gap-2">
            {lowStock.map(i => (
              <AlertCard key={i.id} type="destructive" text={`Stock bajo: ${i.name} (${i.stock_actual} ${i.unit})`} />
            ))}
            {lowMarginProducts.map(p => (
              <AlertCard key={p.product_name} type="warning" text={`Margen bajo: ${p.product_name} (${p.margin.toFixed(1)}%)`} />
            ))}
            {highExpenses && <AlertCard type="warning" text="Gastos superan el 50% de ingresos" />}
          </div>
        )}

        {/* Product ranking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Rentabilidad por producto</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin ventas en este periodo</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 font-medium">Producto</th>
                    <th className="py-2 font-medium text-right">Uds</th>
                    <th className="py-2 font-medium text-right">Ingreso</th>
                    <th className="py-2 font-medium text-right">Costo</th>
                    <th className="py-2 font-medium text-right">Margen</th>
                  </tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.product_name} className="border-b last:border-0">
                        <td className="py-2 font-body">{p.product_name}</td>
                        <td className="py-2 text-right">{p.units_sold}</td>
                        <td className="py-2 text-right">{fmt(p.revenue)}</td>
                        <td className="py-2 text-right">{p.hasRecipe ? fmt(p.cost) : "—"}</td>
                        <td className="py-2 text-right">
                          {p.hasRecipe ? (
                            <Badge variant={p.margin >= 30 ? "default" : p.margin >= 15 ? "secondary" : "destructive"}>
                              {p.margin.toFixed(1)}%
                            </Badge>
                          ) : <span className="text-muted-foreground text-xs">Sin receta</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash & Expenses */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Cash Movements */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-heading">Flujo de caja</CardTitle>
              <Dialog open={cashOpen} onOpenChange={setCashOpen}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" /> Movimiento</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nuevo movimiento</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Select value={cashForm.type} onValueChange={v => setCashForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingreso">Ingreso</SelectItem>
                        <SelectItem value="egreso">Egreso</SelectItem>
                        <SelectItem value="retiro">Retiro personal</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Descripción" value={cashForm.description} onChange={e => setCashForm(f => ({ ...f, description: e.target.value }))} />
                    <Input type="number" placeholder="Monto ($)" value={cashForm.amount} onChange={e => setCashForm(f => ({ ...f, amount: e.target.value }))} />
                    <Button onClick={handleCash} className="w-full">Registrar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {cashMovements.length === 0 ? <p className="text-sm text-muted-foreground">Sin movimientos</p> : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cashMovements.slice(0, 20).map(m => (
                    <div key={m.id} className="flex justify-between items-center text-sm border-b pb-1">
                      <div>
                        <Badge variant={m.type === "ingreso" ? "default" : m.type === "retiro" ? "destructive" : "secondary"} className="text-xs mr-2">{m.type}</Badge>
                        <span className="font-body">{m.description}</span>
                      </div>
                      <span className={`font-medium ${m.type === "ingreso" ? "text-green-600" : "text-destructive"}`}>{fmt(m.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-heading">Gastos</CardTitle>
              <Dialog open={expOpen} onOpenChange={setExpOpen}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" /> Gasto</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nuevo gasto</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Select value={expForm.type} onValueChange={v => setExpForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="insumo">Insumo</SelectItem>
                        <SelectItem value="servicio">Servicio</SelectItem>
                        <SelectItem value="salario">Salario</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Descripción" value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} />
                    <Input type="number" placeholder="Monto ($)" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} />
                    <Button onClick={handleExpense} className="w-full">Registrar gasto</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {expensesList.length === 0 ? <p className="text-sm text-muted-foreground">Sin gastos</p> : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {expensesList.slice(0, 20).map(e => (
                    <div key={e.id} className="flex justify-between items-center text-sm border-b pb-1">
                      <div>
                        <Badge variant="secondary" className="text-xs mr-2">{e.type}</Badge>
                        <span className="font-body">{e.description}</span>
                      </div>
                      <span className="font-medium text-destructive">{fmt(e.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

const KpiCard = ({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs font-body">{label}</span>
      </div>
      <p className={`text-xl font-heading font-bold ${color}`}>{value}</p>
    </CardContent>
  </Card>
);

const AlertCard = ({ type, text }: { type: "destructive" | "warning"; text: string }) => (
  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-body ${type === "destructive" ? "bg-destructive/10 text-destructive" : "bg-yellow-50 text-yellow-700"}`}>
    <AlertTriangle className="w-4 h-4 shrink-0" />
    {text}
  </div>
);

export default OwnerDashboard;
