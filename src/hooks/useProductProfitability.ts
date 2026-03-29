import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, format } from "date-fns";
import type { Period } from "./useFinancialData";

export interface ProductProfit {
  product_name: string;
  units_sold: number;
  revenue: number;
  cost: number;
  margin: number;
  hasRecipe: boolean;
  hasLegacyData: boolean;
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

      // Get delivered order IDs for period
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("status", "entregado")
        .gte("created_at", start);

      const orderIds = (orders || []).map(o => o.id);

      if (orderIds.length === 0) {
        setData([]);
        setEstimatedCost(0);
        setLoading(false);
        return;
      }

      // Get order items — SSOT for all financial data
      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, quantity, unit_price, total, cost_snapshot")
        .in("order_id", orderIds);

      // Aggregate by product using only order_items snapshots
      const agg: Record<string, { units: number; revenue: number; cost: number; hasCost: boolean }> = {};

      (items || []).forEach((item) => {
        if (!agg[item.product_name]) {
          agg[item.product_name] = { units: 0, revenue: 0, cost: 0, hasCost: false };
        }
        agg[item.product_name].units += item.quantity;
        agg[item.product_name].revenue += item.total || 0;

        if (item.cost_snapshot != null && item.cost_snapshot > 0) {
          agg[item.product_name].cost += item.cost_snapshot * item.quantity;
          agg[item.product_name].hasCost = true;
        }
      });

      let totalCost = 0;
      const result: ProductProfit[] = Object.entries(agg)
        .map(([name, { units, revenue, cost, hasCost }]) => {
          totalCost += cost;
          const margin = (revenue > 0 && hasCost)
            ? ((revenue - cost) / revenue) * 100
            : -1; // -1 = "No calculable"
          return {
            product_name: name,
            units_sold: units,
            revenue,
            cost,
            margin,
            hasRecipe: hasCost,
            hasLegacyData: false,
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
