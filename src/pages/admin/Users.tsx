import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  name: string;
  phone: string | null;
  role: string | null;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  revendedor: "Revendedor",
  delivery: "Delivery",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  revendedor: "bg-blue-100 text-blue-800",
  delivery: "bg-green-100 text-green-800",
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    // Get all profiles
    const { data: profiles } = await supabase.from("profiles").select("*");
    // Get all roles
    const { data: roles } = await supabase.from("user_roles").select("*");

    const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role]));

    setUsers(
      (profiles || []).map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        role: roleMap.get(p.id) || null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const assignRole = async (userId: string, newRole: string) => {
    if (newRole === "sin_rol") {
      // Remove role
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (error) {
        toast.error("Error al quitar rol");
        return;
      }
      toast.success("Rol eliminado");
    } else {
      // Upsert role
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id,role" });
      if (error) {
        // Try delete existing then insert
        await supabase.from("user_roles").delete().eq("user_id", userId);
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });
        if (insertError) {
          toast.error("Error al asignar rol");
          return;
        }
      }
      toast.success(`Rol asignado: ${roleLabels[newRole]}`);
    }
    fetchUsers();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Gestión de usuarios</h1>

        {loading ? (
          <p className="text-muted-foreground font-body animate-pulse">Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground font-body">No hay usuarios registrados.</p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-body font-semibold text-sm">{u.name || "Sin nombre"}</span>
                    {u.role && (
                      <Badge className={`${roleColors[u.role] || ""} border-0 text-[10px] font-body`}>
                        {roleLabels[u.role] || u.role}
                      </Badge>
                    )}
                  </div>
                  {u.phone && (
                    <p className="font-body text-xs text-muted-foreground">📱 {u.phone}</p>
                  )}
                </div>
                <Select
                  value={u.role || "sin_rol"}
                  onValueChange={(v) => assignRole(u.id, v)}
                >
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin_rol">Sin rol</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="revendedor">Revendedor</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
