import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Plus, Pencil, UserX, UserCheck, Users, UserPlus, Eye, EyeOff } from "lucide-react";
import type { AppRole } from "@/hooks/useRole";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_by: string;
  reseller_id: string | null;
  is_active: boolean;
  created_at: string;
  price_type: string;
}

const priceTypeLabels: Record<string, { label: string; color: string }> = {
  minorista: { label: "Minorista", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  intermedio: { label: "Intermedio", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  mayorista: { label: "Mayorista", color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" },
};

const emptyForm = { name: "", phone: "", address: "", price_type: "minorista" };
const emptyStaffForm = { email: "", password: "", role: "revendedor" as AppRole };

const allRoles: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "revendedor", label: "Revendedor" },
  { value: "delivery", label: "Delivery" },
];

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Customer CRUD dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // Deactivate confirm
  const [deactivateTarget, setDeactivateTarget] = useState<Customer | null>(null);

  // "Asignar como personal" dialog
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [staffTarget, setStaffTarget] = useState<Customer | null>(null);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Track which customers are already staff
  const [staffCustomerIds, setStaffCustomerIds] = useState<Set<string>>(new Set());

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    setCustomers((data as Customer[]) || []);
    setLoading(false);
  };

  const fetchStaffLinks = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("customer_id")
      .not("customer_id", "is", null);
    const ids = new Set((data || []).map((p: any) => p.customer_id as string));
    setStaffCustomerIds(ids);
  };

  useEffect(() => {
    fetchCustomers();
    fetchStaffLinks();

    const channel = supabase
      .channel("admin-customers-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => fetchCustomers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    );
  }, [customers, search]);

  const openCreate = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({ name: c.name, phone: c.phone || "", address: c.address || "", price_type: c.price_type || "minorista" });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }

    if (form.phone.trim()) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", form.phone.trim())
        .neq("id", editingCustomer?.id || "00000000-0000-0000-0000-000000000000")
        .limit(1);
      if (existing && existing.length > 0) {
        toast.error("Ya existe un cliente con ese teléfono");
        return;
      }
    }

    setSubmitting(true);
    if (editingCustomer) {
      const { error } = await supabase
        .from("customers")
        .update({
          name: form.name.trim(),
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          price_type: form.price_type,
        } as any)
        .eq("id", editingCustomer.id);
      if (error) toast.error("Error al actualizar"); else { toast.success("Cliente actualizado"); setDialogOpen(false); }
    } else {
      const { error } = await supabase.from("customers").insert({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        created_by: "admin",
        price_type: form.price_type,
      } as any);
      if (error) toast.error("Error al crear cliente"); else { toast.success("Cliente creado"); setDialogOpen(false); }
    }
    setSubmitting(false);
  };

  const handleToggleActive = async () => {
    if (!deactivateTarget) return;
    const { error } = await supabase
      .from("customers")
      .update({ is_active: !deactivateTarget.is_active })
      .eq("id", deactivateTarget.id);
    if (error) toast.error("Error"); else toast.success(deactivateTarget.is_active ? "Cliente desactivado" : "Cliente reactivado");
    setDeactivateTarget(null);
  };

  // Staff assignment
  const openStaffDialog = (c: Customer) => {
    setStaffTarget(c);
    setStaffForm(emptyStaffForm);
    setShowPassword(false);
    setStaffDialogOpen(true);
  };

  const invokeManageUsers = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("manage-users", {
      body,
      headers: session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : undefined,
    });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const handleStaffSubmit = async () => {
    if (!staffTarget) return;
    if (!staffForm.email.trim()) { toast.error("El email es obligatorio"); return; }
    if (staffForm.password.length < 6) { toast.error("Contraseña mínimo 6 caracteres"); return; }

    setStaffSubmitting(true);
    try {
      await invokeManageUsers({
        action: "create-user",
        email: staffForm.email.trim(),
        password: staffForm.password,
        name: staffTarget.name,
        phone: staffTarget.phone || "",
        role: staffForm.role,
        customer_id: staffTarget.id,
      });
      toast.success(`${staffTarget.name} asignado como personal`);
      setStaffDialogOpen(false);
      fetchStaffLinks();
    } catch (err: any) {
      toast.error(err.message || "Error al asignar personal");
    } finally {
      setStaffSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display text-2xl font-bold">Clientes</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-accent text-accent-foreground font-body font-semibold text-sm px-4 py-2.5 rounded-full hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" /> Nuevo cliente
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o teléfono..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {loading ? (
          <p className="text-muted-foreground font-body animate-pulse">Cargando clientes...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Users className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="font-body text-muted-foreground">No se encontraron clientes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div
                key={c.id}
                className={`bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-opacity ${!c.is_active ? "opacity-60" : ""}`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body font-semibold text-sm">{c.name}</span>
                    <Badge className={`border-0 text-[10px] font-body ${c.is_active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"}`}>
                      {c.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                    {c.created_by === "revendedor" && (
                      <Badge className="border-0 text-[10px] font-body bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Revendedor</Badge>
                    )}
                    {staffCustomerIds.has(c.id) && (
                      <Badge className="border-0 text-[10px] font-body bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">Personal</Badge>
                    )}
                  </div>
                  {c.phone && <p className="font-body text-xs text-muted-foreground">📱 {c.phone}</p>}
                  {c.address && <p className="font-body text-xs text-muted-foreground">📍 {c.address}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {c.is_active && !staffCustomerIds.has(c.id) && (
                    <button
                      onClick={() => openStaffDialog(c)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 font-body text-xs hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Asignar como personal
                    </button>
                  )}
                  <button onClick={() => openEdit(c)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-body text-xs hover:bg-secondary/80 transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => setDeactivateTarget(c)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs transition-colors ${c.is_active ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"}`}
                  >
                    {c.is_active ? <><UserX className="w-3.5 h-3.5" /> Desactivar</> : <><UserCheck className="w-3.5 h-3.5" /> Reactivar</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Customer Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingCustomer ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-body text-sm">Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del cliente" />
            </div>
            <div>
              <Label className="font-body text-sm">Teléfono</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11-2345-6789" />
            </div>
            <div>
              <Label className="font-body text-sm">Dirección</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Av. Corrientes 1234" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg font-body text-sm text-muted-foreground hover:bg-secondary transition-colors">Cancelar</button>
            <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-body font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
              {submitting ? "Guardando..." : editingCustomer ? "Guardar cambios" : "Crear cliente"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate/Reactivate Confirm */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{deactivateTarget?.is_active ? "¿Desactivar cliente?" : "¿Reactivar cliente?"}</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              {deactivateTarget?.is_active ? `"${deactivateTarget?.name}" no aparecerá en búsquedas de pedidos.` : `"${deactivateTarget?.name}" volverá a estar disponible.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive} className={`font-body ${deactivateTarget?.is_active ? "bg-destructive text-destructive-foreground" : ""}`}>
              {deactivateTarget?.is_active ? "Desactivar" : "Reactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Asignar como personal Dialog */}
      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Asignar como personal</DialogTitle>
          </DialogHeader>
          <p className="font-body text-sm text-muted-foreground">
            Crear cuenta de acceso para <strong>{staffTarget?.name}</strong>
            {staffTarget?.phone && ` (${staffTarget.phone})`}
          </p>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-body text-sm">Email *</Label>
              <Input
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                placeholder="personal@email.com"
              />
            </div>
            <div>
              <Label className="font-body text-sm">Contraseña *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <Label className="font-body text-sm">Rol</Label>
              <Select value={staffForm.role} onValueChange={(v) => setStaffForm({ ...staffForm, role: v as AppRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setStaffDialogOpen(false)} className="px-4 py-2 rounded-lg font-body text-sm text-muted-foreground hover:bg-secondary transition-colors">Cancelar</button>
            <button
              onClick={handleStaffSubmit}
              disabled={staffSubmitting}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white font-body font-semibold text-sm hover:bg-violet-700 transition-all disabled:opacity-50"
            >
              {staffSubmitting ? "Asignando..." : "Asignar personal"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminCustomers;
