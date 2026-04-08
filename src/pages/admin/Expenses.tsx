import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useExpenses, CATEGORIES, type Expense } from "@/hooks/useExpenses";
import { useFinancialData } from "@/hooks/useFinancialData";
import { useRecurringExpenses, type RecurringExpense, type RecurringExpenseInput } from "@/hooks/useRecurringExpenses";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { formatCurrency } from "@/utils/currency";
import { Plus, DollarSign, TrendingDown, Percent, Trash2, Pencil, AlertTriangle, CalendarClock } from "lucide-react";

const fmt = formatCurrency;

const categoryLabel = (val: string) => CATEGORIES.find(c => c.value === val)?.label || val;

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const ExpensesPage = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const { expenses, loading, create, update, remove, totalMonth, totalToday } = useExpenses(categoryFilter || undefined);
  const { revenue } = useFinancialData("mes");
  const { items: recurringItems, create: createRecurring, update: updateRecurring, remove: removeRecurring, toggleActive, loading: recurringLoading } = useRecurringExpenses();

  const [createOpen, setCreateOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);

  // Recurring expense dialogs
  const [recCreateOpen, setRecCreateOpen] = useState(false);
  const [editRecurring, setEditRecurring] = useState<RecurringExpense | null>(null);
  const [deleteRecurring, setDeleteRecurring] = useState<RecurringExpense | null>(null);

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

        {/* ========== RECURRING EXPENSES SECTION ========== */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <CalendarClock className="w-4 h-4" /> Gastos programados
              </CardTitle>
              <Button size="sm" onClick={() => setRecCreateOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recurringLoading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : recurringItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin gastos programados. Agregá gastos fijos como alquiler, servicios, etc.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 px-3 font-medium">Nombre</th>
                      <th className="py-2 px-3 font-medium text-right">Monto</th>
                      <th className="py-2 px-3 font-medium">Frecuencia</th>
                      <th className="py-2 px-3 font-medium">Día</th>
                      <th className="py-2 px-3 font-medium text-center">Activo</th>
                      <th className="py-2 px-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recurringItems.map(r => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-2 px-3 font-body">{r.name}</td>
                        <td className="py-2 px-3 text-right font-medium">
                          {r.amount !== null ? fmt(r.amount) : <Badge variant="outline" className="text-xs">Variable</Badge>}
                        </td>
                        <td className="py-2 px-3 font-body">{r.frequency === "monthly" ? "Mensual" : "Semanal"}</td>
                        <td className="py-2 px-3 font-body">
                          {r.frequency === "monthly" ? `Día ${r.day_of_month}` : DAYS_OF_WEEK[r.day_of_week ?? 0]}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <Switch checked={r.active} onCheckedChange={v => toggleActive(r.id, v)} />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditRecurring(r)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteRecurring(r)}>
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

        {/* Edit expense dialog */}
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

        {/* Delete expense confirmation */}
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

        {/* Create recurring expense dialog */}
        <Dialog open={recCreateOpen} onOpenChange={setRecCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Nuevo gasto programado</DialogTitle></DialogHeader>
            <RecurringExpenseForm
              onSubmit={async (data) => {
                const ok = await createRecurring(data);
                if (ok) setRecCreateOpen(false);
              }}
              onClose={() => setRecCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit recurring expense dialog */}
        <Dialog open={!!editRecurring} onOpenChange={open => !open && setEditRecurring(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Editar gasto programado</DialogTitle></DialogHeader>
            {editRecurring && (
              <RecurringExpenseForm
                initialData={editRecurring}
                onSubmit={async (data) => {
                  const ok = await updateRecurring(editRecurring.id, data);
                  if (ok) setEditRecurring(null);
                }}
                onClose={() => setEditRecurring(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete recurring expense confirmation */}
        <Dialog open={!!deleteRecurring} onOpenChange={open => !open && setDeleteRecurring(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Eliminar gasto programado</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                ¿Eliminar "{deleteRecurring?.name}"?
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteRecurring(null)}>Cancelar</Button>
                <Button variant="destructive" onClick={async () => {
                  if (deleteRecurring) {
                    await removeRecurring(deleteRecurring.id);
                    setDeleteRecurring(null);
                  }
                }}>Eliminar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

// ========== Recurring Expense Form Component ==========
const RecurringExpenseForm = ({
  initialData,
  onSubmit,
  onClose,
}: {
  initialData?: RecurringExpense;
  onSubmit: (data: RecurringExpenseInput) => Promise<void>;
  onClose: () => void;
}) => {
  const [name, setName] = useState(initialData?.name || "");
  const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
  const [frequency, setFrequency] = useState<"monthly" | "weekly">(initialData?.frequency || "monthly");
  const [dayOfMonth, setDayOfMonth] = useState(initialData?.day_of_month?.toString() || "1");
  const [dayOfWeek, setDayOfWeek] = useState(initialData?.day_of_week?.toString() || "1");
  const [startDate, setStartDate] = useState(initialData?.start_date || new Date().toISOString().split("T")[0]);
  const [active, setActive] = useState(initialData?.active ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({
      name,
      amount: amount.trim() ? Number(amount) : null,
      frequency,
      day_of_month: frequency === "monthly" ? Number(dayOfMonth) : null,
      day_of_week: frequency === "weekly" ? Number(dayOfWeek) : null,
      start_date: startDate,
      active,
    });
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Nombre</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Alquiler, Luz, Gas" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Monto (dejar vacío = variable)</Label>
        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ej: 50000" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Frecuencia</Label>
        <Select value={frequency} onValueChange={v => setFrequency(v as "monthly" | "weekly")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Mensual</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {frequency === "monthly" ? (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Día del mes</Label>
          <Input type="number" min={1} max={31} value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Día de la semana</Label>
          <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map((d, i) => (
                <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">Fecha de inicio</Label>
        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Activo</Label>
        <Switch checked={active} onCheckedChange={setActive} />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
          {initialData ? "Guardar" : "Crear"}
        </Button>
      </div>
    </div>
  );
};

export default ExpensesPage;
