import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Plus, Pencil, UserX, UserCheck, Users } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  created_by: string;
  reseller_id: string | null;
  is_active: boolean;
  created_at: string;
}

const emptyForm = { name: "", phone: "", address: "" };

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [deactivateTarget, setDeactivateTarget] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    setCustomers((data as Customer[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();

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
    setForm({ name: c.name, phone: c.phone || "", address: c.address || "" });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }

    // Check unique phone
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
        })
        .eq("id", editingCustomer.id);
      if (error) toast.error("Error al actualizar"); else { toast.success("Cliente actualizado"); setDialogOpen(false); }
    } else {
      const { error } = await supabase.from("customers").insert({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        created_by: "admin",
      });
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
                  </div>
                  {c.phone && <p className="font-body text-xs text-muted-foreground">📱 {c.phone}</p>}
                  {c.address && <p className="font-body text-xs text-muted-foreground">📍 {c.address}</p>}
                </div>
                <div className="flex items-center gap-2">
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
    </DashboardLayout>
  );
};

export default AdminCustomers;
