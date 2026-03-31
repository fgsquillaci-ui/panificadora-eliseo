import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenses, CATEGORIES, type Expense } from "@/hooks/useExpenses";
import { useFinancialData } from "@/hooks/useFinancialData";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { formatCurrency } from "@/utils/currency";
import { Plus, DollarSign, TrendingDown, Percent, Trash2, Pencil, AlertTriangle } from "lucide-react";

const fmt = formatCurrency;

const categoryLabel = (val: string) => CATEGORIES.find(c => c.value === val)?.label || val;

const ExpensesPage = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const { expenses, loading, create, update, remove, totalMonth, totalToday } = useExpenses(categoryFilter || undefined);
  const { revenue } = useFinancialData("mes");

  const [createOpen, setCreateOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);

  const pctRevenue = revenue > 0 ? ((totalMonth / revenue) * 100).toFixed(1) : "—";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-heading font-bold text-foreground">Gastos</h1>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-1" /> Registrar gasto</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nuevo gasto</DialogTitle></DialogHeader>
              <ExpenseForm onSubmit={create} onClose={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-body">Total del mes</span>
              </div>
              <p className="text-xl font-heading font-bold text-destructive">{fmt(totalMonth)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-body">Gastos hoy</span>
              </div>
              <p className="text-xl font-heading font-bold text-foreground">{fmt(totalToday)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Percent className="w-4 h-4" />
                <span className="text-xs font-body">% sobre ingresos</span>
              </div>
              <p className="text-xl font-heading font-bold text-foreground">{pctRevenue}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={categoryFilter || "todas"} onValueChange={v => setCategoryFilter(v === "todas" ? "" : v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
            ) : expenses.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Sin gastos registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-3 px-4 font-medium">Fecha</th>
                      <th className="py-3 px-4 font-medium">Categoría</th>
                      <th className="py-3 px-4 font-medium">Descripción</th>
                      <th className="py-3 px-4 font-medium text-right">Monto</th>
                      <th className="py-3 px-4 font-medium">Pago</th>
                      <th className="py-3 px-4 font-medium">Proveedor</th>
                      <th className="py-3 px-4 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4 font-body">{e.date}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-xs">{categoryLabel(e.category || e.type)}</Badge>
                        </td>
                        <td className="py-3 px-4 font-body">{e.description}</td>
                        <td className="py-3 px-4 text-right font-medium text-destructive">{fmt(e.amount)}</td>
                        <td className="py-3 px-4 font-body capitalize">{e.payment_method || "—"}</td>
                        <td className="py-3 px-4 font-body">{e.supplier || "—"}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditExpense(e)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteExpense(e)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit dialog */}
        <Dialog open={!!editExpense} onOpenChange={open => !open && setEditExpense(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editar gasto</DialogTitle></DialogHeader>
            {editExpense && (
              <ExpenseForm
                initialData={editExpense}
                onSubmit={data => update(editExpense.id, data)}
                onClose={() => setEditExpense(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <Dialog open={!!deleteExpense} onOpenChange={open => !open && setDeleteExpense(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Eliminar gasto</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Eliminar este gasto de {deleteExpense && fmt(deleteExpense.amount)}?
              </p>
              {deleteExpense?.batch_id && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Este gasto está vinculado a un lote de materia prima. Al eliminarlo, el lote será removido y el stock se actualizará.
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteExpense(null)}>Cancelar</Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (deleteExpense) {
                      await remove(deleteExpense.id);
                      setDeleteExpense(null);
                    }
                  }}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ExpensesPage;
