import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

type OrderStatus = "pendiente" | "en_produccion" | "enviado" | "entregado";

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  delivery_type: string;
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

const RevendedorDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Mis pedidos</h1>

        {loading ? (
          <p className="text-muted-foreground font-body animate-pulse">Cargando...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Package className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="font-body text-muted-foreground">Aún no tenés pedidos.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-card rounded-xl border p-4 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-body font-semibold text-sm">
                      ${order.total.toLocaleString("es-AR")}
                    </span>
                    <Badge className={`${statusColors[order.status]} border-0 text-[10px] font-body`}>
                      {statusLabels[order.status]}
                    </Badge>
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    {order.delivery_type === "delivery" ? "📍 Delivery" : "🏪 Retiro"}
                    {" · "}{new Date(order.created_at).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RevendedorDashboard;
