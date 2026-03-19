import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Package, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface Stats {
  todaySales: number;
  activeOrders: number;
  deliveredOrders: number;
  totalOrders: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({ todaySales: 0, activeOrders: 0, deliveredOrders: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [ordersRes, todayRes] = await Promise.all([
        supabase.from("orders").select("id, status, total"),
        supabase.from("orders").select("total").gte("created_at", today + "T00:00:00"),
      ]);

      const orders = ordersRes.data || [];
      const todayOrders = todayRes.data || [];

      setStats({
        todaySales: todayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        activeOrders: orders.filter((o) => o.status !== "entregado").length,
        deliveredOrders: orders.filter((o) => o.status === "entregado").length,
        totalOrders: orders.length,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div key={card.label} className="bg-card rounded-xl border p-5 space-y-2">
                <div className={`${card.color}`}>{card.icon}</div>
                <p className="font-display text-2xl font-bold">{card.value}</p>
                <p className="font-body text-xs text-muted-foreground">{card.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
