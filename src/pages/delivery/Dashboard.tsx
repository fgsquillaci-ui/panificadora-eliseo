import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import OrderDetail from "@/components/OrderDetail";
import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, Clock, Package } from "lucide-react";
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
  delivery_type: string;
  created_at: string;
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
        delivery_type: o?.delivery_type || "delivery",
        created_at: o?.created_at || "",
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

  const pendingCount = orders.filter((o) => o.delivery_status !== "entregado").length;
  const completedCount = orders.filter((o) => o.delivery_status === "entregado").length;

  const cards = [
    { label: "Pendientes", value: pendingCount, icon: <Clock className="w-5 h-5" />, color: "text-accent" },
    { label: "Completadas", value: completedCount, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600" },
    { label: "Total asignadas", value: orders.length, icon: <Package className="w-5 h-5" />, color: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Mis entregas</h1>

        {loading ? (
          <p className="text-muted-foreground font-body animate-pulse">Cargando...</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {cards.map((card) => (
                <div key={card.label} className="bg-card rounded-xl border p-5 space-y-2">
                  <div className={card.color}>{card.icon}</div>
                  <p className="font-display text-2xl font-bold">{card.value}</p>
                  <p className="font-body text-xs text-muted-foreground">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="font-body text-muted-foreground">No tenés entregas asignadas.</p>
                </div>
              ) : (
                orders.map((o) => (
                  <OrderDetail
                    key={o.delivery_id}
                    orderId={o.order_id}
                    customerName={o.customer_name}
                    customerPhone={o.customer_phone}
                    address={o.address}
                    addressReferences={o.address_references}
                    status={o.delivery_status === "entregado" ? "entregado" : "enviado"}
                    total={o.total}
                    deliveryType={o.delivery_type}
                    createdAt={o.created_at}
                    actions={
                      o.delivery_status !== "entregado" ? (
                        <Button
                          size="sm"
                          onClick={() => markDelivered(o.delivery_id, o.order_id)}
                          className="gap-1.5 font-body text-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Marcar entregado
                        </Button>
                      ) : undefined
                    }
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeliveryDashboard;
