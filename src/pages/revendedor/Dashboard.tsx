import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import OrderDetail from "@/components/OrderDetail";
import CreateOrderForm from "@/components/CreateOrderForm";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { Package, CheckCircle, Clock, DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type OrderStatus = "pendiente" | "en_produccion" | "listo" | "en_delivery" | "entregado";

const filterOptions: { label: string; value: OrderStatus | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendiente", value: "pendiente" },
  { label: "En producción", value: "en_produccion" },
  { label: "Listo", value: "listo" },
  { label: "En delivery", value: "en_delivery" },
  { label: "Entregado", value: "entregado" },
];

const RevendedorDashboard = () => {
  const { user, profile } = useAuth();
  const { orders, loading } = useRealtimeOrders({ userId: user?.id });
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = filter === "todos" ? orders : orders.filter((o) => o.status === filter);
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status !== "entregado").length;
  const delivered = orders.filter((o) => o.status === "entregado").length;

  const cards = [
    { label: "Total gastado", value: `$${totalSpent.toLocaleString("es-AR")}`, icon: <DollarSign className="w-5 h-5" />, color: "text-green-600" },
    { label: "Pendientes", value: pending, icon: <Clock className="w-5 h-5" />, color: "text-accent" },
    { label: "Entregados", value: delivered, icon: <CheckCircle className="w-5 h-5" />, color: "text-blue-600" },
    { label: "Total pedidos", value: orders.length, icon: <Package className="w-5 h-5" />, color: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold">Mis pedidos</h1>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5 font-body text-sm w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Nuevo pedido
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground font-body animate-pulse">Cargando...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {cards.map((card) => (
                <div key={card.label} className="bg-card rounded-xl border p-3 md:p-5 space-y-2">
                  <div className={card.color}>{card.icon}</div>
                  <p className="font-display text-xl md:text-2xl font-bold">{card.value}</p>
                  <p className="font-body text-xs text-muted-foreground">{card.label}</p>
                </div>
              ))}
            </div>

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
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="font-body text-muted-foreground">No hay pedidos con este filtro.</p>
                </div>
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
                  />
                ))
              )}
            </div>
          </>
        )}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Nuevo pedido</DialogTitle>
              <DialogDescription className="font-body text-sm">Cargá los productos y datos del cliente</DialogDescription>
            </DialogHeader>
            <CreateOrderForm
              createdBy="revendedor"
              resellerName={profile?.name || null}
              onSuccess={() => setShowCreate(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default RevendedorDashboard;
