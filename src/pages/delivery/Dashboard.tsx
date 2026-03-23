import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import OrderDetail from "@/components/OrderDetail";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { Button } from "@/components/ui/button";
import { CheckCircle, MapPin, Clock, Package } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/orderHistory";

const DeliveryDashboard = () => {
  // Fetch ALL orders with status en_delivery directly — no deliveries table dependency
  const { orders: pendingOrders, loading: loadingPending } = useRealtimeOrders({ statusFilter: "en_delivery" });
  const { orders: completedOrders, loading: loadingCompleted } = useRealtimeOrders({ statusFilter: "entregado" });

  const loading = loadingPending || loadingCompleted;

  const markDelivered = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "entregado" as any })
      .eq("id", orderId);
    if (error) {
      toast.error("Error al marcar como entregado");
    } else {
      toast.success("¡Pedido marcado como entregado!");
    }
  };

  const cards = [
    { label: "Por entregar", value: pendingOrders.length, icon: <Clock className="w-5 h-5" />, color: "text-orange-600" },
    { label: "Completadas", value: completedOrders.length, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600" },
    { label: "Total", value: pendingOrders.length + completedOrders.length, icon: <Package className="w-5 h-5" />, color: "text-muted-foreground" },
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

            {pendingOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-lg font-semibold">Por entregar</h2>
                {pendingOrders.map((o) => (
                  <OrderDetail
                    key={o.id}
                    orderId={o.id}
                    customerName={o.customer_name}
                    customerPhone={o.customer_phone}
                    address={o.address}
                    addressReferences={o.address_references}
                    status="en_delivery"
                    total={o.total}
                    deliveryType={o.delivery_type}
                    createdAt={o.created_at}
                    actions={
                      <Button
                        size="sm"
                        onClick={() => markDelivered(o.id)}
                        className="gap-1.5 font-body text-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Marcar entregado
                      </Button>
                    }
                  />
                ))}
              </div>
            )}

            {completedOrders.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-display text-lg font-semibold text-muted-foreground">Completadas</h2>
                {completedOrders.map((o) => (
                  <OrderDetail
                    key={o.id}
                    orderId={o.id}
                    customerName={o.customer_name}
                    customerPhone={o.customer_phone}
                    address={o.address}
                    addressReferences={o.address_references}
                    status="entregado"
                    total={o.total}
                    deliveryType={o.delivery_type}
                    createdAt={o.created_at}
                  />
                ))}
              </div>
            )}

            {pendingOrders.length === 0 && completedOrders.length === 0 && (
              <div className="text-center py-12 space-y-3">
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="font-body text-muted-foreground">No tenés entregas asignadas.</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DeliveryDashboard;
