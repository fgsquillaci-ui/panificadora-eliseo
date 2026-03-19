import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type OrderStatus = "pendiente" | "en_produccion" | "listo" | "en_delivery" | "entregado";

const STATUS_FLOW: OrderStatus[] = ["pendiente", "en_produccion", "listo", "en_delivery", "entregado"];

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  delivery_type: string;
  address: string | null;
  status: OrderStatus;
  total: number;
  created_at: string;
  reseller_name: string | null;
  created_by: string;
}

const statusLabels: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  en_produccion: "En producción",
  listo: "Listo",
  en_delivery: "En delivery",
  entregado: "Entregado",
};

const statusColors: Record<OrderStatus, string> = {
  pendiente: "bg-gray-100 text-gray-800",
  en_produccion: "bg-yellow-100 text-yellow-800",
  listo: "bg-blue-100 text-blue-800",
  en_delivery: "bg-orange-100 text-orange-800",
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

  const updateStatus = async (orderId: string, currentStatus: OrderStatus, newStatus: OrderStatus) => {
    // Validate sequential transition
    const currentIdx = STATUS_FLOW.indexOf(currentStatus);
    const newIdx = STATUS_FLOW.indexOf(newStatus);
    if (newIdx !== currentIdx + 1 && newIdx !== currentIdx) {
      toast.error("Solo podés avanzar al siguiente estado");
      return;
    }
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus as any })
      .eq("id", orderId);
    if (error) {
      toast.error("Error al actualizar estado");
    } else {
      toast.success(`Estado actualizado a "${statusLabels[newStatus]}"`);
      fetchOrders();
    }
  };

  const getNextStatuses = (current: OrderStatus): OrderStatus[] => {
    const idx = STATUS_FLOW.indexOf(current);
    if (idx < 0) return STATUS_FLOW;
    // Allow current + next only
    const result = [current];
    if (idx < STATUS_FLOW.length - 1) result.push(STATUS_FLOW[idx + 1]);
    return result;
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
              {STATUS_FLOW.map((s) => (
                <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
              ))}
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
                    {order.reseller_name ? (
                      <span className="font-body text-[10px] text-muted-foreground">vía {order.reseller_name}</span>
                    ) : (
                      <span className="font-body text-[10px] text-primary font-medium">Directo</span>
                    )}
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
                  onValueChange={(v) => updateStatus(order.id, order.status, v as OrderStatus)}
                >
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getNextStatuses(order.status).map((s) => (
                      <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                    ))}
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
