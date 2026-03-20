import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Plus, Pencil, Users } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
}

const emptyForm = { name: "", phone: "", address: "" };

const RevendedorCustomers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("reseller_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setCustomers((data as Customer[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();

    const channel = supabase
      .channel("reseller-customers-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => fetchCustomers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
  }, [customers, search]);

  const openCreate = () => { setEditingCustomer(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Customer) => { setEditingCustomer(c); setForm({ name: c.name, phone: c.phone || "", address: c.address || "" }); setDialogOpen(true); };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }

    if (form.phone.trim()) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", form.phone.trim())
        .neq("id", editingCustomer?.id || "00000000-0000-0000-0000-000000000000")
        .limit(1);
      if (existing && existing.length > 0) { toast.error("Ya existe un cliente con ese teléfono"); return; }
    }

    setSubmitting(true);
    if (editingCustomer) {
      const { error } = await supabase.from("customers").update({ name: form.name.trim(), phone: form.phone.trim() || null, address: form.address.trim() || null }).eq("id", editingCustomer.id);
      if (error) toast.error("Error al actualizar"); else { toast.success("Cliente actualizado"); setDialogOpen(false); }
    } else {
      const { error } = await supabase.from("customers").insert({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        created_by: "revendedor",
        reseller_id: user.id,
      });
      if (error) toast.error("Error al crear cliente"); else { toast.success("Cliente creado"); setDialogOpen(false); }
    }
    setSubmitting(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display text-2xl font-bold">Mis clientes</h1>
          <button onClick={openCreate} className="flex items-center gap-2 bg-accent text-accent-foreground font-body font-semibold text-sm px-4 py-2.5 rounded-full hover:brightness-110 transition-all">
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
            <p className="font-body text-muted-foreground">No tenés clientes aún. ¡Creá el primero!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div key={c.id} className="bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <span className="font-body font-semibold text-sm">{c.name}</span>
                  {c.phone && <p className="font-body text-xs text-muted-foreground">📱 {c.phone}</p>}
                  {c.address && <p className="font-body text-xs text-muted-foreground">📍 {c.address}</p>}
                </div>
                <button onClick={() => openEdit(c)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-body text-xs hover:bg-secondary/80 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
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
            <div><Label className="font-body text-sm">Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del cliente" /></div>
            <div><Label className="font-body text-sm">Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11-2345-6789" /></div>
            <div><Label className="font-body text-sm">Dirección</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Av. Corrientes 1234" /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg font-body text-sm text-muted-foreground hover:bg-secondary transition-colors">Cancelar</button>
            <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-body font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50">
              {submitting ? "Guardando..." : editingCustomer ? "Guardar cambios" : "Crear cliente"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default RevendedorCustomers;
