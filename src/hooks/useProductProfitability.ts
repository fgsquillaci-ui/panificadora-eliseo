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

      // Get order items for those orders
      const { data: items } = await supabase.from("order_items").select("product_name, quantity, unit_price, total").in("order_id", orderIds);

      // Get all recipes with ingredient costs
      const { data: recipes } = await supabase.from("recipes").select("product_id, quantity, ingredients(costo_unitario), products(name)");

      // Build cost map: product_name → cost per unit
      const costMap: Record<string, number> = {};
      const recipeProducts = new Set<string>();
      (recipes || []).forEach((r: any) => {
        const pName = r.products?.name;
        if (!pName) return;
        recipeProducts.add(pName);
        costMap[pName] = (costMap[pName] || 0) + Number(r.quantity) * (r.ingredients?.costo_unitario || 0);
      });

      // Aggregate by product
      const agg: Record<string, { units: number; revenue: number }> = {};
      (items || []).forEach(i => {
        if (!agg[i.product_name]) agg[i.product_name] = { units: 0, revenue: 0 };
        agg[i.product_name].units += i.quantity;
        agg[i.product_name].revenue += i.total;
      });

      let totalCost = 0;
      const result: ProductProfit[] = Object.entries(agg).map(([name, { units, revenue }]) => {
        const hasRecipe = recipeProducts.has(name);
        const unitCost = costMap[name] || 0;
        const cost = unitCost * units;
        totalCost += cost;
        const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
        return { product_name: name, units_sold: units, revenue, cost, margin: hasRecipe ? margin : -1, hasRecipe };
      }).sort((a, b) => b.revenue - a.revenue);

      setData(result);
      setEstimatedCost(totalCost);
      setLoading(false);
    };
    run();
  }, [period]);

  return { products: data, estimatedCost, loading };
}
