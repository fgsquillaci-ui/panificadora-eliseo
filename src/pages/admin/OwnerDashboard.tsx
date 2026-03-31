import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFinancialData, type Period } from "@/hooks/useFinancialData";
import { useProductProfitability, type TierFilter } from "@/hooks/useProductProfitability";
import { useIngredients } from "@/hooks/useIngredients";
import { usePurchases } from "@/hooks/usePurchases";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Plus, Percent, Wallet, BarChart3, RefreshCw, Tag, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/currency";

const fmt = formatCurrency;

const OwnerDashboard = () => {
  const [period, setPeriod] = useState<Period>("hoy");
  const [tierFilter, setTierFilter] = useState<TierFilter>(null);
  const { revenue, expenses, expensesList, cashMovements, totalWithdrawals, loading } = useFinancialData(period, tierFilter);
  const { products, estimatedCost, loading: profitLoading } = useProductProfitability(period, tierFilter);
  const { ingredients, lowStock, update: updateIngredient } = useIngredients();
  const { purchases: allPurchases } = usePurchases();

  // Pending payments
  const [pendingPayments, setPendingPayments] = useState<{ count: number; total: number }>({ count: 0, total: 0 });
  const [pendingOrders, setPendingOrders] = useState<{ id: string; total: number; customer_name: string }[]>([]);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const fetchPending = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, total, payment_status, customer_name")
      .eq("status", "entregado" as any)
      .neq("payment_status", "cobrado");
    const items = (data || []) as { id: string; total: number; customer_name: string }[];
    setPendingOrders(items);
    setPendingPayments({ count: items.length, total: items.reduce((s, o) => s + (o.total || 0), 0) });
  };
  useEffect(() => { fetchPending(); }, [period]);

  const markAsPaid = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ payment_status: "cobrado" } as any).eq("id", orderId);
    if (error) { toast.error("Error al actualizar"); return; }
    toast.success("Pedido marcado como cobrado");
    fetchPending();
  };

  // Product pricing data — uses unit_cost from products table (SSOT)
  const [pricingData, setPricingData] = useState<any[]>([]);
  useEffect(() => {
    const fetchPricing = async () => {
      const { data: prods } = await supabase.from("products").select("id, name, target_margin, retail_price, wholesale_price, intermediate_price, unit_cost");

      const rows = (prods || []).map((p: any) => {
        const cost = p.unit_cost ?? 0;
        // Select price based on tierFilter from products table
        let tierPrice: number | null = null;
        if (tierFilter === "mayorista") {
          tierPrice = p.wholesale_price ?? p.retail_price;
        } else if (tierFilter === "intermedio") {
          tierPrice = p.intermediate_price ?? p.retail_price;
        } else {
          tierPrice = p.retail_price;
        }
        const targetMargin = p.target_margin ?? 30;
        const currentMargin = tierPrice && tierPrice > 0 ? ((tierPrice - cost) / tierPrice) * 100 : null;
        const suggestedPrice = targetMargin < 100 ? Math.round(cost / (1 - targetMargin / 100)) : cost;
        return { id: p.id, name: p.name, cost, price: tierPrice, targetMargin, currentMargin, suggestedPrice, hasRecipe: cost > 0 };
      }).filter((p: any) => p.hasRecipe);
      
      setPricingData(rows);
    };
    fetchPricing();
  }, [ingredients, tierFilter]);

  const profit = revenue - estimatedCost - expenses;
  const margin = revenue > 0 ? ((revenue - estimatedCost) / revenue) * 100 : 0;
  const available = Math.max(0, profit - totalWithdrawals);

  // Alerts
  const lowMarginProducts = products.filter(p => p.hasRecipe && p.margin !== null && p.margin < 20 && p.margin >= 0);
  const highExpenses = revenue > 0 && expenses > revenue * 0.5;
  const negativeMarginPricing = pricingData.filter(p => p.currentMargin !== null && p.currentMargin < 0);


  const applySuggestedPrice = async (productId: string, suggestedPrice: number) => {
    const priceColumn = tierFilter === "mayorista" ? "wholesale_price" : tierFilter === "intermedio" ? "intermediate_price" : "retail_price";
    const { error } = await supabase.from("products").update({ [priceColumn]: suggestedPrice, last_cost_sync_at: new Date().toISOString() } as any).eq("id", productId);
    if (error) { toast.error("Error al actualizar precio"); } else {
      toast.success("Precio actualizado");
      setPricingData(prev => prev.map(p => p.id === productId ? { ...p, price: suggestedPrice, currentMargin: p.targetMargin } : p));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-heading font-bold text-foreground">Panel Financiero</h1>
          <div className="flex items-center gap-3">
            {/* Tier filter */}
            <Select value={tierFilter ?? "todos"} onValueChange={v => setTierFilter(v === "todos" ? null : v as TierFilter)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Tipo de venta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="minorista">Minorista</SelectItem>
                <SelectItem value="intermedio">Intermedio</SelectItem>
                <SelectItem value="mayorista">Mayorista</SelectItem>
              </SelectContent>
            </Select>
            {/* Period selector */}
            <div className="flex gap-1 bg-secondary rounded-lg p-1">
              {(["hoy", "semana", "mes"] as Period[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-body font-medium transition-colors ${period === p ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
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
        {(lowStock.length > 0 || lowMarginProducts.length > 0 || highExpenses || pendingPayments.count > 0 || negativeMarginPricing.length > 0) && (
          <div className="grid gap-2">
            {pendingPayments.count > 0 && (
              <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-body bg-yellow-50 text-yellow-700`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {`${pendingPayments.count} pedido(s) entregado(s) sin cobrar — ${fmt(pendingPayments.total)} pendiente`}
                </div>
                <Dialog open={pendingDialogOpen} onOpenChange={setPendingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="shrink-0">Ver pedidos</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Pedidos sin cobrar</DialogTitle></DialogHeader>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {pendingOrders.map(o => (
                        <div key={o.id} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <p className="text-sm font-medium">{o.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{fmt(o.total)}</p>
                          </div>
                          <Button size="sm" variant="default" onClick={() => markAsPaid(o.id)}>Cobrado</Button>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {negativeMarginPricing.map(p => (
              <AlertCard key={p.id} type="destructive" text={`Margen negativo: ${p.name} (${p.currentMargin.toFixed(1)}%)`} />
            ))}
            {lowStock.map(i => (
              <AlertCard key={i.id} type="destructive" text={`Stock bajo: ${i.name} (${i.stock_actual} ${i.unit})`} />
            ))}
            {lowMarginProducts.map(p => (
              <AlertCard key={p.product_name} type="warning" text={`Margen bajo: ${p.product_name} (${p.margin!.toFixed(1)}%)`} />
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
                      <tr key={p.product_id} className="border-b last:border-0">
                        <td className="py-2 font-body flex items-center gap-1">
                          {p.product_name}
                          {p.priceDeviation && (
                            <TooltipProvider><Tooltip><TooltipTrigger>
                              <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                            </TooltipTrigger><TooltipContent><p className="text-xs">Precio aplicado difiere del oficial</p></TooltipContent></Tooltip></TooltipProvider>
                          )}
                        </td>
                        <td className="py-2 text-right">{p.units_sold}</td>
                        <td className="py-2 text-right">{fmt(p.revenue)}</td>
                        <td className="py-2 text-right">{p.hasRecipe ? fmt(p.cost) : <span className="text-muted-foreground text-xs">Sin costo</span>}</td>
                        <td className="py-2 text-right">
                          {p.margin !== null ? (
                            <Badge variant={p.margin >= 30 ? "default" : p.margin >= 15 ? "secondary" : "destructive"}>
                              {p.margin.toFixed(1)}%
                            </Badge>
                          ) : <span className="text-muted-foreground text-xs">No calculable</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Panel */}
        {pricingData.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2"><Tag className="w-4 h-4" /> Decisión de precios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 font-medium">Producto</th>
                    <th className="py-2 font-medium text-right">Costo</th>
                    <th className="py-2 font-medium text-right">Precio actual</th>
                    <th className="py-2 font-medium text-right">Margen actual</th>
                    <th className="py-2 font-medium text-right">Objetivo</th>
                    <th className="py-2 font-medium text-right">Precio mínimo</th>
                    <th className="py-2 font-medium text-right">Acción</th>
                  </tr></thead>
                  <tbody>
                    {pricingData.map(p => (
                      <tr key={p.id} className="border-b last:border-0">
                        <td className="py-2 font-body">{p.name}</td>
                        <td className="py-2 text-right">{fmt(p.cost)}</td>
                        <td className="py-2 text-right">{p.price !== null ? fmt(Math.round(p.price)) : <span className="text-muted-foreground text-xs">Sin ventas</span>}</td>
                        <td className="py-2 text-right">
                          {p.currentMargin !== null ? (
                            <Badge variant={p.currentMargin >= p.targetMargin ? "default" : p.currentMargin >= p.targetMargin - 5 ? "secondary" : "destructive"}>
                              {p.currentMargin.toFixed(1)}%
                            </Badge>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="py-2 text-right text-muted-foreground">{p.targetMargin}%</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cost Analysis */}
        <CostAnalysisSection ingredients={ingredients} purchases={allPurchases} onUpdateCost={updateIngredient} />

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

// Cost Analysis Section
import type { Ingredient } from "@/hooks/useIngredients";
import type { Purchase } from "@/hooks/usePurchases";

const CostAnalysisSection = ({ ingredients, purchases, onUpdateCost }: {
  ingredients: Ingredient[];
  purchases: Purchase[];
  onUpdateCost: (id: string, values: Partial<Ingredient>) => Promise<boolean>;
}) => {
  const avgCosts: Record<string, number> = {};
  const grouped: Record<string, { totalCost: number; totalQty: number }> = {};
  purchases.forEach(p => {
    if (!grouped[p.ingredient_id]) grouped[p.ingredient_id] = { totalCost: 0, totalQty: 0 };
    grouped[p.ingredient_id].totalCost += p.total_cost;
    grouped[p.ingredient_id].totalQty += p.quantity;
  });
  Object.entries(grouped).forEach(([id, { totalCost, totalQty }]) => {
    if (totalQty > 0) avgCosts[id] = Math.round(totalCost / totalQty);
  });

  const rows = ingredients
    .filter(i => avgCosts[i.id] !== undefined)
    .map(i => {
      const suggested = avgCosts[i.id];
      const diff = i.costo_unitario > 0 ? ((suggested - i.costo_unitario) / i.costo_unitario * 100) : 0;
      return { ...i, suggested, diff };
    })
    .filter(r => Math.abs(r.diff) > 5)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Análisis de costos — Materia Prima</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="py-2 font-medium">Materia prima</th>
              <th className="py-2 font-medium text-right">Costo actual</th>
              <th className="py-2 font-medium text-right">Costo sugerido</th>
              <th className="py-2 font-medium text-right">Diferencia</th>
              <th className="py-2 font-medium text-right">Acción</th>
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 font-body">{r.name}</td>
                  <td className="py-2 text-right">{fmt(r.costo_unitario / 100)}/{r.unit}</td>
                  <td className="py-2 text-right">{fmt(r.suggested / 100)}/{r.unit}</td>
                  <td className="py-2 text-right">
                    <Badge variant={Math.abs(r.diff) > 15 ? "destructive" : "secondary"}>
                      {r.diff > 0 ? "+" : ""}{r.diff.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    <Button size="sm" variant="outline" onClick={async () => {
                      await onUpdateCost(r.id, { costo_unitario: r.suggested });
                    }}>Actualizar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default OwnerDashboard;
