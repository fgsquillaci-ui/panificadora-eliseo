import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import OrderDetail from "@/components/OrderDetail";
import CreateOrderForm from "@/components/CreateOrderForm";
import { useRealtimeOrders, type Order } from "@/hooks/useRealtimeOrders";
import { CheckCircle, Clock, TrendingUp, Plus, Factory, PackageCheck, Truck, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { logError } from "@/lib/orderHistory";

type OrderStatus = "pendiente" | "en_produccion" | "listo" | "en_delivery" | "entregado";

const STATUS_FLOW: OrderStatus[] = ["pendiente", "en_produccion", "listo", "en_delivery", "entregado"];

const statusLabels: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  en_produccion: "En producción",
  listo: "Listo",
  en_delivery: "En delivery",
  entregado: "Entregado",
};

const nextStatusAction: Record<string, { label: string; icon: React.ReactNode }> = {
  pendiente: { label: "En producción", icon: <Factory className="w-3.5 h-3.5" /> },
  en_produccion: { label: "Listo", icon: <PackageCheck className="w-3.5 h-3.5" /> },
  listo: { label: "Enviar a delivery", icon: <Truck className="w-3.5 h-3.5" /> },
  en_delivery: { label: "Entregado", icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

const prevStatusAction: Record<string, { label: string }> = {
  en_produccion: { label: "← Pendiente" },
  listo: { label: "← En producción" },
  en_delivery: { label: "← Listo" },
};

const filterOptions: { label: string; value: OrderStatus | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendiente", value: "pendiente" },
  { label: "En producción", value: "en_produccion" },
  { label: "Listo", value: "listo" },
  { label: "En delivery", value: "en_delivery" },
  { label: "Entregado", value: "entregado" },
];

const AdminDashboard = () => {
  const { orders, loading } = useRealtimeOrders({ limit: 100 });
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [showCreate, setShowCreate] = useState(false);

  const changeStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus as any })
      .eq("id", orderId);
    if (error) {
      toast.error("Error al actualizar estado");
      logError("Status change failed", { orderId, newStatus, error });
    } else {
      toast.success(`Estado → ${statusLabels[newStatus]}`);
    }
  };

  const advanceStatus = (orderId: string, currentStatus: OrderStatus) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    changeStatus(orderId, STATUS_FLOW[idx + 1]);
  };

  const revertStatus = (orderId: string, currentStatus: OrderStatus) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx <= 0) return;
    changeStatus(orderId, STATUS_FLOW[idx - 1]);
  };

  const filtered = filter === "todos" ? orders : orders.filter((o) => o.status === filter);

  const today = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.created_at.startsWith(today));
  const todaySales = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const statusCounts = STATUS_FLOW.reduce((acc, st) => {
    acc[st] = orders.filter((o) => o.status === st).length;
    return acc;
  }, {} as Record<OrderStatus, number>);

  const cards = [
    { label: "Ventas del día", value: `$${todaySales.toLocaleString("es-AR")}`, icon: <TrendingUp className="w-5 h-5" />, color: "text-green-600" },
    { label: "Pendientes", value: statusCounts.pendiente, icon: <Clock className="w-5 h-5" />, color: "text-muted-foreground" },
    { label: "En producción", value: statusCounts.en_produccion, icon: <Factory className="w-5 h-5" />, color: "text-yellow-600" },
    { label: "Entregados hoy", value: todayOrders.filter((o) => o.status === "entregado").length, icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold">Panel de administración</h1>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5 font-body text-sm">
            <Plus className="w-4 h-4" /> Crear pedido
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground font-body animate-pulse">Cargando...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((card) => (
                <div key={card.label} className="bg-card rounded-xl border p-5 space-y-2">
                  <div className={card.color}>{card.icon}</div>
                  <p className="font-display text-2xl font-bold">{card.value}</p>
                  <p className="font-body text-xs text-muted-foreground">{card.label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Pedidos</h2>
              <div className="flex gap-2 flex-wrap">
                {filterOptions.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`px-3 py-1.5 rounded-full font-body text-xs transition-colors ${
                      filter === f.value
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {f.label}
                    {f.value !== "todos" && ` (${statusCounts[f.value as OrderStatus] || 0})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filtered.length === 0 ? (
                <p className="font-body text-sm text-muted-foreground text-center py-8">No hay pedidos con este filtro.</p>
              ) : (
                filtered.map((order) => (
                  <OrderDetail
                    key={order.id}
                    orderId={order.id}
                    customerName={order.customer_name}
                    customerPhone={order.customer_phone}
                    address={order.address}
                    addressReferences={order.address_references}
                    status={order.status}
                    total={order.total}
                    deliveryType={order.delivery_type}
                    createdAt={order.created_at}
                    resellerName={order.reseller_name}
                    actions={
                      <div className="flex gap-1.5 flex-wrap">
                        {prevStatusAction[order.status] && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revertStatus(order.id, order.status)}
                            className="gap-1 font-body text-xs"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            {prevStatusAction[order.status]?.label}
                          </Button>
                        )}
                        {order.status !== "entregado" && nextStatusAction[order.status] && (
                          <Button
                            size="sm"
                            onClick={() => advanceStatus(order.id, order.status)}
                            className="gap-1.5 font-body text-xs"
                          >
                            {nextStatusAction[order.status]?.icon}
                            {nextStatusAction[order.status]?.label}
                          </Button>
                        )}
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Crear pedido</DialogTitle>
              <DialogDescription className="font-body text-sm">Venta directa desde administración</DialogDescription>
            </DialogHeader>
            <CreateOrderForm
              createdBy="admin"
              resellerName={null}
              onSuccess={() => setShowCreate(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
