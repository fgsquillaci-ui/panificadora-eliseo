import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type OrderStatus = "pendiente" | "en_produccion" | "enviado" | "entregado";

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  delivery_type: string;
  address: string | null;
  status: OrderStatus;
  total: number;
  created_at: string;
}

const statusLabels: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  en_produccion: "En producción",
  enviado: "Enviado",
  entregado: "Entregado",
};

const statusColors: Record<OrderStatus, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  en_produccion: "bg-blue-100 text-blue-800",
  enviado: "bg-purple-100 text-purple-800",
  entregado: "bg-green-100 text-green-800",
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>("todos");
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    if (error) {
      toast.error("Error al actualizar estado");
    } else {
      toast.success(`Estado actualizado a "${statusLabels[newStatus]}"`);
      fetchOrders();
    }
  };

  const filtered = filter === "todos" ? orders : orders.filter((o) => o.status === filter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold">Gestión de pedidos</h1>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="en_produccion">En producción</SelectItem>
              <SelectItem value="enviado">Enviados</SelectItem>
              <SelectItem value="entregado">Entregados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground font-body animate-pulse">Cargando pedidos...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground font-body">No hay pedidos.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <div key={order.id} className="bg-card rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body font-semibold text-sm">{order.customer_name}</span>
                    <Badge className={`${statusColors[order.status]} border-0 text-[10px] font-body`}>
                      {statusLabels[order.status]}
                    </Badge>
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    {order.delivery_type === "delivery" ? `📍 ${order.address || "Sin dirección"}` : "🏪 Retiro en local"}
                    {" · "}${order.total.toLocaleString("es-AR")}
                    {" · "}{new Date(order.created_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <Select
                  value={order.status}
                  onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}
                >
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_produccion">En producción</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
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

export default AdminOrders;
