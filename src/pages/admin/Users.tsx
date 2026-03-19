import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search } from "lucide-react";
import type { AppRole } from "@/hooks/useRole";

interface UserWithRoles {
  id: string;
  name: string;
  phone: string | null;
  roles: AppRole[];
}

const allRoles: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "revendedor", label: "Revendedor" },
  { value: "delivery", label: "Delivery" },
];

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  revendedor: "bg-blue-100 text-blue-800",
  delivery: "bg-green-100 text-green-800",
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");

    const roleMap = new Map<string, AppRole[]>();
    (roles || []).forEach((r) => {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role as AppRole);
      roleMap.set(r.user_id, existing);
    });

    setUsers(
      (profiles || []).map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        roles: roleMap.get(p.id) || [],
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (userId: string, role: AppRole, hasIt: boolean) => {
    if (hasIt) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) {
        toast.error("Error al quitar rol");
        return;
      }
      toast.success(`Rol ${role} eliminado`);
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert([{ user_id: userId, role }]);
      if (error) {
        toast.error("Error al asignar rol");
        return;
      }
      toast.success(`Rol ${role} asignado`);
    }
    fetchUsers();
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone && u.phone.includes(search))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Gestión de usuarios</h1>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <p className="text-muted-foreground font-body animate-pulse">Cargando usuarios...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground font-body">No se encontraron usuarios.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => (
              <div key={u.id} className="bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body font-semibold text-sm">{u.name || "Sin nombre"}</span>
                    {u.roles.map((r) => (
                      <Badge key={r} className={`${roleColors[r] || ""} border-0 text-[10px] font-body`}>
                        {allRoles.find((ar) => ar.value === r)?.label || r}
                      </Badge>
                    ))}
                  </div>
                  {u.phone && (
                    <p className="font-body text-xs text-muted-foreground">📱 {u.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {allRoles.map((r) => {
                    const hasIt = u.roles.includes(r.value);
                    return (
                      <label key={r.value} className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={hasIt}
                          onCheckedChange={() => toggleRole(u.id, r.value, hasIt)}
                        />
                        <span className="font-body text-xs">{r.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
