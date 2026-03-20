import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Plus, User } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
}

interface CustomerPickerProps {
  selectedCustomer: Customer | null;
  onSelect: (customer: Customer) => void;
  createdBy: "admin" | "revendedor";
  resellerId: string | null;
}

const CustomerPicker = ({ selectedCustomer, onSelect, createdBy, resellerId }: CustomerPickerProps) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [submitting, setSubmitting] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (search.trim().length < 1) { setResults([]); return; }
      let query = supabase
        .from("customers")
        .select("id, name, phone, address")
        .eq("is_active", true)
        .or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
        .limit(10);

      if (createdBy === "revendedor" && resellerId) {
        query = query.eq("reseller_id", resellerId);
      }

      const { data } = await query;
      setResults((data as Customer[]) || []);
    };

    const timeout = setTimeout(fetchCustomers, 200);
    return () => clearTimeout(timeout);
  }, [search, createdBy, resellerId]);

  const handleSelect = (c: Customer) => {
    onSelect(c);
    setSearch(c.name);
    setShowDropdown(false);
  };

  const handleCreateSubmit = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }

    if (form.phone.trim()) {
      const { data: existing } = await supabase.from("customers").select("id").eq("phone", form.phone.trim()).limit(1);
      if (existing && existing.length > 0) { toast.error("Ya existe un cliente con ese teléfono"); return; }
    }

    setSubmitting(true);
    const insertData: Record<string, unknown> = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      created_by: createdBy,
    };
    if (createdBy === "revendedor" && resellerId) {
      insertData.reseller_id = resellerId;
    }

    const { data, error } = await supabase.from("customers").insert(insertData).select("id, name, phone, address").single();
    if (error || !data) {
      toast.error("Error al crear cliente");
    } else {
      toast.success("Cliente creado");
      onSelect(data as Customer);
      setSearch((data as Customer).name);
      setShowCreate(false);
    }
    setSubmitting(false);
  };

  const clearSelection = () => {
    onSelect(null as any);
    setSearch("");
  };

  return (
    <div className="space-y-1.5">
      <Label className="font-body text-xs">Cliente</Label>

      {selectedCustomer ? (
        <div className="flex items-center gap-2 rounded-lg border bg-primary/5 border-primary p-2.5">
          <User className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-body text-xs font-semibold truncate">{selectedCustomer.name}</p>
            {selectedCustomer.phone && <p className="font-body text-[10px] text-muted-foreground">{selectedCustomer.phone}</p>}
          </div>
          <button onClick={clearSelection} className="font-body text-[10px] text-destructive hover:underline shrink-0">Cambiar</button>
        </div>
      ) : (
        <div ref={wrapperRef} className="relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Buscar cliente por nombre o teléfono..."
              className="pl-8 text-xs"
            />
          </div>
          {showDropdown && (
            <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors"
                >
                  <p className="font-body text-xs font-medium">{c.name}</p>
                  {c.phone && <p className="font-body text-[10px] text-muted-foreground">{c.phone}</p>}
                </button>
              ))}
              {results.length === 0 && search.trim().length > 0 && (
                <p className="font-body text-xs text-muted-foreground px-3 py-2">Sin resultados</p>
              )}
              <button
                onClick={() => { setShowDropdown(false); setForm({ name: search, phone: "", address: "" }); setShowCreate(true); }}
                className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors border-t flex items-center gap-1.5 text-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="font-body text-xs font-semibold">Nuevo cliente</span>
              </button>
            </div>
          )}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="font-display text-base">Nuevo cliente</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div><Label className="font-body text-xs">Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre" /></div>
            <div><Label className="font-body text-xs">Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11-2345-6789" /></div>
            <div><Label className="font-body text-xs">Dirección</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Av. Corrientes 1234" /></div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded-lg font-body text-xs text-muted-foreground hover:bg-secondary transition-colors">Cancelar</button>
            <button onClick={handleCreateSubmit} disabled={submitting} className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-body font-semibold text-xs hover:brightness-110 transition-all disabled:opacity-50">
              {submitting ? "Creando..." : "Crear y seleccionar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerPicker;
