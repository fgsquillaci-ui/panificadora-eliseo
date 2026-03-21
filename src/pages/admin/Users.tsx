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
import { Search, Plus, Pencil, UserX, UserCheck, Eye, EyeOff } from "lucide-react";
import type { AppRole } from "@/hooks/useRole";

interface UserWithRoles {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
  roles: AppRole[];
}

const allRoles: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "revendedor", label: "Revendedor" },
  { value: "delivery", label: "Delivery" },
];

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  revendedor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  delivery: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

const emptyForm = { name: "", phone: "", email: "", password: "", role: "revendedor" as AppRole };

const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Deactivate confirm
  const [deactivateTarget, setDeactivateTarget] = useState<UserWithRoles | null>(null);

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
      (profiles || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        is_active: p.is_active ?? true,
        roles: roleMap.get(p.id) || [],
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        (u.phone && u.phone.includes(search));
      const matchRole = filterRole === "all" || u.roles.includes(filterRole as AppRole);
      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && u.is_active) ||
        (filterStatus === "inactive" && !u.is_active);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, filterRole, filterStatus]);

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

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEdit = async (user: UserWithRoles) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      phone: user.phone || "",
      email: "",
      password: "",
      role: user.roles[0] || "revendedor",
    });
    setShowPassword(false);
    setDialogOpen(true);

    // Fetch email
    try {
      const data = await invokeManageUsers({ action: "get-user-email", user_id: user.id });
      setForm((f) => ({ ...f, email: data.email || "" }));
    } catch {
      // ignore
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!editingUser && !form.email.trim()) {
      toast.error("El email es obligatorio");
      return;
    }
    if (!editingUser && form.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        await invokeManageUsers({
          action: "update-user",
          user_id: editingUser.id,
          name: form.name.trim(),
          phone: form.phone.trim(),
          role: form.role,
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
          ...(form.password ? { password: form.password } : {}),
        });
        toast.success("Personal actualizado");
      } else {
        await invokeManageUsers({
          action: "create-user",
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          phone: form.phone.trim(),
          role: form.role,
        });
        toast.success("Personal creado");
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      if (deactivateTarget.is_active) {
        await invokeManageUsers({ action: "deactivate-user", user_id: deactivateTarget.id });
        toast.success("Personal desactivado");
      } else {
        await invokeManageUsers({
          action: "update-user",
          user_id: deactivateTarget.id,
          is_active: true,
        });
        toast.success("Personal reactivado");
      }
      setDeactivateTarget(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Error");
      setDeactivateTarget(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display text-2xl font-bold">Gestión de personal</h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-accent text-accent-foreground font-body font-semibold text-sm px-4 py-2.5 rounded-full hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo personal
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              {allRoles.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User list */}
        {loading ? (
          <p className="text-muted-foreground font-body animate-pulse">Cargando personal...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground font-body">No se encontró personal.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => (
              <div
                key={u.id}
                className={`bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-opacity ${
                  !u.is_active ? "opacity-60" : ""
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body font-semibold text-sm">{u.name || "Sin nombre"}</span>
                    {u.roles.map((r) => (
                      <Badge key={r} className={`${roleColors[r] || ""} border-0 text-[10px] font-body`}>
                        {allRoles.find((ar) => ar.value === r)?.label || r}
                      </Badge>
                    ))}
                    <Badge
                      className={`border-0 text-[10px] font-body ${
                        u.is_active
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {u.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  {u.phone && (
                    <p className="font-body text-xs text-muted-foreground">📱 {u.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(u)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-body text-xs hover:bg-secondary/80 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => setDeactivateTarget(u)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs transition-colors ${
                      u.is_active
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
                    }`}
                  >
                    {u.is_active ? (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        Desactivar
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        Reactivar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
             <DialogTitle className="font-display">
              {editingUser ? "Editar personal" : "Nuevo personal"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-body text-sm">Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <Label className="font-body text-sm">Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="usuario@email.com"
              />
            </div>
            <div>
              <Label className="font-body text-sm">
                Contraseña {editingUser ? "(dejar vacío para no cambiar)" : "*"}
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? "••••••" : "Mínimo 6 caracteres"}
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
              <Label className="font-body text-sm">Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Número de teléfono"
              />
            </div>
            <div>
              <Label className="font-body text-sm">Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
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
            <button
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 rounded-lg font-body text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-accent text-accent-foreground font-body font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              {submitting ? "Guardando..." : editingUser ? "Guardar cambios" : "Crear personal"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate/Reactivate Confirm */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={(open) => !open && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {deactivateTarget?.is_active ? "¿Desactivar personal?" : "¿Reactivar personal?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              {deactivateTarget?.is_active
                ? `Se desactivará a "${deactivateTarget?.name}". No podrá iniciar sesión hasta ser reactivado.`
                : `Se reactivará a "${deactivateTarget?.name}". Podrá volver a iniciar sesión.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className={`font-body ${
                deactivateTarget?.is_active ? "bg-destructive text-destructive-foreground" : ""
              }`}
            >
              {deactivateTarget?.is_active ? "Desactivar" : "Reactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminUsers;
