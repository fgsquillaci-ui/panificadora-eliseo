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

      // Get delivered order ids for period
      const { data: orders } = await supabase.from("orders").select("id").eq("status", "entregado").gte("created_at", start);
      const orderIds = (orders || []).map(o => o.id);

      if (orderIds.length === 0) { setData([]); setEstimatedCost(0); setLoading(false); return; }

      // Get order items for those orders (include snapshots)
      const { data: items } = await supabase.from("order_items").select("product_name, quantity, unit_price, total, cost_snapshot, margin_snapshot, product_id").in("order_id", orderIds);

      // Get all recipes with ingredient costs (fallback for items without snapshots)
      const { data: recipes } = await supabase.from("recipes").select("product_id, quantity, ingredients(costo_unitario), products(name)");

      // Build cost map: product_name → cost per unit (fallback)
      const costMap: Record<string, number> = {};
      const recipeProducts = new Set<string>();
      (recipes || []).forEach((r: any) => {
        const pName = r.products?.name;
        if (!pName) return;
        recipeProducts.add(pName);
        costMap[pName] = (costMap[pName] || 0) + Number(r.quantity) * (r.ingredients?.costo_unitario || 0);
      });

      // Aggregate by product
      const agg: Record<string, { units: number; revenue: number; snapshotCost: number; hasSnapshot: boolean; hasLegacy: boolean }> = {};
      (items || []).forEach((i: any) => {
        if (!agg[i.product_name]) agg[i.product_name] = { units: 0, revenue: 0, snapshotCost: 0, hasSnapshot: false, hasLegacy: false };
        agg[i.product_name].units += i.quantity;
        // Revenue: use total if > 0, fallback to unit_price * quantity for legacy items
        const itemRevenue = (i.total && i.total > 0) ? i.total : (i.unit_price * i.quantity);
        agg[i.product_name].revenue += itemRevenue;
        // Track legacy: item without complete snapshot (total=0 or no cost_snapshot)
        if (!i.total || i.total === 0 || !i.cost_snapshot || i.cost_snapshot === 0) {
          agg[i.product_name].hasLegacy = true;
        }
        // Use snapshot if available, otherwise will fallback to recipe
        if (i.cost_snapshot && i.cost_snapshot > 0) {
          agg[i.product_name].snapshotCost += i.cost_snapshot * i.quantity;
          agg[i.product_name].hasSnapshot = true;
        }
      });

      let totalCost = 0;
      const result: ProductProfit[] = Object.entries(agg).map(([name, { units, revenue, snapshotCost, hasSnapshot, hasLegacy }]) => {
        const hasRecipe = recipeProducts.has(name);
        // Prefer snapshot cost, fallback to recipe-based cost
        const cost = hasSnapshot ? snapshotCost : (costMap[name] || 0) * units;
        totalCost += cost;
        const hasCostData = hasRecipe || hasSnapshot;
        const margin = (revenue > 0 && hasCostData) ? ((revenue - cost) / revenue) * 100 : -1;
        return { product_name: name, units_sold: units, revenue, cost, margin, hasRecipe: hasCostData, hasLegacyData: hasLegacy };
      }).sort((a, b) => b.revenue - a.revenue);

      setData(result);
      setEstimatedCost(totalCost);
      setLoading(false);
    };
    run();
  }, [period]);

  return { products: data, estimatedCost, loading };
}
