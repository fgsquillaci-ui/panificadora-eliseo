import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, format } from "date-fns";
import type { Period } from "./useFinancialData";

export interface ProductProfit {
  product_name: string;
  units_sold: number;
  revenue: number;
  cost: number;
  margin: number | null;
  hasRecipe: boolean;
}

function getPeriodStart(period: Period): string {
  const now = new Date();
  switch (period) {
    case "hoy": return format(startOfDay(now), "yyyy-MM-dd'T'HH:mm:ss");
    case "semana": return format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss");
    case "mes": return format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss");
  }
}

export function useProductProfitability(period: Period) {
  const [data, setData] = useState<ProductProfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const start = getPeriodStart(period);

      // Single query: order_items with inner join to delivered orders
      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, quantity, unit_price, total, cost_snapshot, orders!inner(status, created_at)")
        .eq("orders.status", "entregado" as any)
        .gte("orders.created_at", start);

      if (!items || items.length === 0) {
        setData([]);
        setEstimatedCost(0);
        setLoading(false);
        return;
      }

      // Aggregate by product — pure snapshot logic
      const agg: Record<string, { units: number; revenue: number; cost: number; hasCost: boolean }> = {};
      (items as any[]).forEach((item) => {
        const name = item.product_name;
        if (!agg[name]) agg[name] = { units: 0, revenue: 0, cost: 0, hasCost: false };

        const qty = item.quantity ?? 0;
        agg[name].units += qty;

        // Revenue: use total if > 0, data repair fallback
        const itemRevenue = item.total && item.total > 0 ? item.total : (item.unit_price ?? 0) * qty;
        agg[name].revenue += itemRevenue;

        // Cost: only from snapshot
        const costSnap = item.cost_snapshot ?? 0;
        if (costSnap > 0) {
          agg[name].cost += costSnap * qty;
          agg[name].hasCost = true;
        }
      });

      let totalCost = 0;
      const result: ProductProfit[] = Object.entries(agg)
        .map(([name, { units, revenue, cost, hasCost }]) => {
          totalCost += cost;
          const margin = revenue > 0 && hasCost ? ((revenue - cost) / revenue) * 100 : null;
          return {
            product_name: name,
            units_sold: units,
            revenue,
            cost,
            margin,
            hasRecipe: hasCost,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);

      setData(result);
      setEstimatedCost(totalCost);
      setLoading(false);
    };
    run();
  }, [period]);

  return { products: data, estimatedCost, loading };
}
