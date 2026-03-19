import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin } from "lucide-react";
import { toast } from "sonner";

interface AssignedOrder {
  delivery_id: string;
  delivery_status: string;
  order_id: string;
  customer_name: string;
  customer_phone: string | null;
  address: string | null;
  address_references: string | null;
  order_status: string;
  total: number;
}

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<AssignedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssigned = async () => {
    if (!user) return;
    const { data: deliveries } = await supabase
      .from("deliveries")
      .select("id, status, order_id")
      .eq("delivery_user_id", user.id);

    if (!deliveries || deliveries.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const orderIds = deliveries.map((d) => d.order_id);
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .in("id", orderIds);

    const mapped: AssignedOrder[] = deliveries.map((d) => {
      const o = (ordersData || []).find((o) => o.id === d.order_id);
      return {
        delivery_id: d.id,
        delivery_status: d.status,
        order_id: d.order_id,
        customer_name: o?.customer_name || "",
        customer_phone: o?.customer_phone || null,
        address: o?.address || null,
        address_references: o?.address_references || null,
        order_status: o?.status || "",
        total: o?.total || 0,
      };
    });

    setOrders(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchAssigned();
  }, [user]);

  const markDelivered = async (deliveryId: string, orderId: string) => {
    await Promise.all([
      supabase.from("deliveries").update({ status: "entregado" }).eq("id", deliveryId),
      supabase.from("orders").update({ status: "entregado" as any }).eq("id", orderId),
    ]);
    toast.success("¡Pedido marcado como entregado!");
    fetchAssigned();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Mis entregas</h1>

        {loading ? (
          <p className="text-muted-foreground font-body animate-pulse">Cargando...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="font-body text-muted-foreground">No tenés entregas asignadas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.delivery_id} className="bg-card rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-body font-semibold text-sm">{o.customer_name}</span>
                    {o.customer_phone && (
                      <span className="font-body text-xs text-muted-foreground ml-2">📱 {o.customer_phone}</span>
                    )}
                  </div>
                  <Badge className={`border-0 text-[10px] font-body ${
                    o.delivery_status === "entregado" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {o.delivery_status === "entregado" ? "Entregado" : "Pendiente"}
                  </Badge>
                </div>

                {o.address && (
                  <p className="font-body text-xs text-muted-foreground">
                    📍 {o.address}
                    {o.address_references && ` — ${o.address_references}`}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-body text-sm font-semibold">${o.total.toLocaleString("es-AR")}</span>
                  {o.delivery_status !== "entregado" && (
                    <Button
                      size="sm"
                      onClick={() => markDelivered(o.delivery_id, o.order_id)}
                      className="gap-1.5 font-body text-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Marcar entregado
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeliveryDashboard;
