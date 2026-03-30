import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, format } from "date-fns";
import type { Period } from "./useFinancialData";

export type TierFilter = "minorista" | "intermedio" | "mayorista" | null;

export interface ProductProfit {
  product_id: string;
  product_name: string;
  units_sold: number;
  revenue: number;
  cost: number;
  margin: number | null;
  unitPrice: number | null;
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

export function useProductProfitability(period: Period, tierFilter: TierFilter = null) {
  const [data, setData] = useState<ProductProfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const start = getPeriodStart(period);

      let query = supabase
        .from("order_items")
        .select("product_id, product_name, quantity, unit_price, total, cost_snapshot, pricing_tier_applied, orders!inner(status, created_at)")
        .eq("orders.status", "entregado" as any)
        .gte("orders.created_at", start);

      if (tierFilter) {
        query = query.eq("pricing_tier_applied", tierFilter);
      }

      const { data: items } = await query;

      if (!items || items.length === 0) {
        setData([]);
        setEstimatedCost(0);
        setLoading(false);
        return;
      }

      // Aggregate by product_id
      const agg: Record<string, { id: string; name: string; units: number; revenue: number; cost: number; hasCost: boolean }> = {};
      (items as any[]).forEach((item) => {
        const pid = item.product_id || item.product_name;
        const name = item.product_name;
        if (!agg[pid]) agg[pid] = { id: pid, name, units: 0, revenue: 0, cost: 0, hasCost: false };

        const qty = item.quantity ?? 0;
        agg[pid].units += qty;

        const itemRevenue = item.total && item.total > 0 ? item.total : (item.unit_price ?? 0) * qty;
        agg[pid].revenue += itemRevenue;

        const costSnap = item.cost_snapshot ?? 0;
        if (costSnap > 0) {
          agg[pid].cost += costSnap * qty;
          agg[pid].hasCost = true;
        }
      });

      let totalCost = 0;
      const result: ProductProfit[] = Object.entries(agg)
        .map(([_, { id, name, units, revenue, cost, hasCost }]) => {
          totalCost += cost;
          const margin = revenue > 0 && hasCost ? ((revenue - cost) / revenue) * 100 : null;
          const unitPrice = units > 0 ? revenue / units : null;
          return {
            product_id: id,
            product_name: name,
            units_sold: units,
            revenue,
            cost,
            margin,
            unitPrice,
            hasRecipe: hasCost,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);

      setData(result);
      setEstimatedCost(totalCost);
      setLoading(false);
    };
    run();
  }, [period, tierFilter]);

  return { products: data, estimatedCost, loading };
}
