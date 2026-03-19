import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import OrderDetail from "@/components/OrderDetail";
import { Package, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type OrderStatus = "pendiente" | "en_produccion" | "enviado" | "entregado";

interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  delivery_type: string;
  customer_name: string;
  customer_phone: string | null;
  address: string | null;
  address_references: string | null;
}

interface Stats {
  todaySales: number;
  activeOrders: number;
  deliveredOrders: number;
  totalOrders: number;
}

const filterOptions: { label: string; value: OrderStatus | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendiente", value: "pendiente" },
  { label: "En producción", value: "en_produccion" },
  { label: "Enviado", value: "enviado" },
  { label: "Entregado", value: "entregado" },
];

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({ todaySales: 0, activeOrders: 0, deliveredOrders: 0, totalOrders: 0 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [allRes, todayRes, recentRes] = await Promise.all([
        supabase.from("orders").select("id, status, total"),
        supabase.from("orders").select("total").gte("created_at", today + "T00:00:00"),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(20),
      ]);

      const all = allRes.data || [];
      const todayOrders = todayRes.data || [];

      setStats({
        todaySales: todayOrders.reduce((s, o) => s + (o.total || 0), 0),
        activeOrders: all.filter((o) => o.status !== "entregado").length,
        deliveredOrders: all.filter((o) => o.status === "entregado").length,
        totalOrders: all.length,
      });

      setOrders((recentRes.data as Order[]) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = filter === "todos" ? orders : orders.filter((o) => o.status === filter);

  const cards = [
    { label: "Ventas del día", value: `$${stats.todaySales.toLocaleString("es-AR")}`, icon: <TrendingUp className="w-5 h-5" />, color: "text-green-600" },
    { label: "Pedidos activos", value: stats.activeOrders, icon: <Clock className="w-5 h-5" />, color: "text-accent" },
    { label: "Entregados", value: stats.deliveredOrders, icon: <CheckCircle className="w-5 h-5" />, color: "text-blue-600" },
    { label: "Total pedidos", value: stats.totalOrders, icon: <Package className="w-5 h-5" />, color: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Panel de administración</h1>

        {loading ? (
          <p className="text-muted-foreground font-body animate-pulse">Cargando estadísticas...</p>
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

            {/* Filters */}
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Últimos pedidos</h2>
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
            </div>

            {/* Order list */}
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

export default AdminDashboard;
