import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, format } from "date-fns";
import type { Period, CustomRange } from "./useFinancialData";

export type TierFilter = "minorista" | "intermedio" | "mayorista" | null;

export interface ProductProfit {
  product_id: string;
  product_name: string;
  units_sold: number;
  revenue: number;
  cost: number;
  margin: number | null;
  hasRecipe: boolean;
  priceDeviation: boolean;
}

function getPeriodStart(period: Period, customRange?: CustomRange): string {
  if (period === "custom" && customRange) return customRange.from;
  if (period === "todo") return "2020-01-01T00:00:00";
  const now = new Date();
  switch (period) {
    case "hoy": return format(startOfDay(now), "yyyy-MM-dd'T'HH:mm:ss");
    case "semana": return format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss");
    case "mes": return format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss");
    default: return format(startOfDay(now), "yyyy-MM-dd'T'HH:mm:ss");
  }
}

function getExpectedPrice(
  product: { retail_price: number | null; wholesale_price: number | null; intermediate_price: number | null },
  tier: string | null
): number {
  switch (tier) {
    case "mayorista":
      return product.wholesale_price ?? product.retail_price ?? 0;
    case "intermedio":
      return product.intermediate_price ?? product.retail_price ?? 0;
    default:
      return product.retail_price ?? 0;
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

      const [{ data: items }, { data: productRows }] = await Promise.all([
        query,
        supabase.from("products").select("id, retail_price, wholesale_price, intermediate_price"),
      ]);

      if (!items || items.length === 0) {
        setData([]);
        setEstimatedCost(0);
        setLoading(false);
        return;
      }

      // Build product price map (for price deviation only, NOT for cost)
      const priceMap: Record<string, { retail_price: number | null; wholesale_price: number | null; intermediate_price: number | null }> = {};
      (productRows || []).forEach((p: any) => {
        priceMap[p.id] = { retail_price: p.retail_price, wholesale_price: p.wholesale_price, intermediate_price: p.intermediate_price };
      });

      // Aggregate by product_id, also track dominant tier
      const agg: Record<string, {
        id: string; name: string; units: number; revenue: number; cost: number; hasCost: boolean;
        tierCounts: Record<string, number>;
      }> = {};

      (items as any[]).forEach((item) => {
        const pid = item.product_id || item.product_name;
        const name = item.product_name;
        if (!agg[pid]) agg[pid] = { id: pid, name, units: 0, revenue: 0, cost: 0, hasCost: false, tierCounts: {} };

        const qty = item.quantity ?? 0;
        agg[pid].units += qty;

        const itemRevenue = item.total && item.total > 0 ? item.total : (item.unit_price ?? 0) * qty;
        agg[pid].revenue += itemRevenue;

        // Use historical cost_snapshot instead of dynamic unit_cost
        const costSnap = item.cost_snapshot;
        if (costSnap !== null && costSnap !== undefined) {
          agg[pid].cost += costSnap;
          agg[pid].hasCost = true;
        }

        // Track tier counts for dominant tier detection
        const tier = item.pricing_tier_applied || "minorista";
        agg[pid].tierCounts[tier] = (agg[pid].tierCounts[tier] || 0) + qty;
      });

      let totalCost = 0;

      // Validation: warn if cost seems anomalous
      Object.values(agg).forEach(({ name, revenue, cost }) => {
        if (cost > revenue * 2 && revenue > 0) {
          console.warn("Cost scaling anomaly detected", { name, revenue, cost });
        }
      });

      const result: ProductProfit[] = Object.entries(agg)
        .map(([_, { id, name, units, revenue, cost, hasCost, tierCounts }]) => {
          totalCost += cost;
          const margin = revenue > 0 && hasCost ? ((revenue - cost) / revenue) * 100 : null;

          // Price deviation: compare avg unit price vs expected price from products table
          let priceDeviation = false;
          if (units > 0 && priceMap[id]) {
            const avgUnitPrice = revenue / units;
            // Find dominant tier
            const dominantTier = Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "minorista";
            const expectedPrice = getExpectedPrice(priceMap[id], dominantTier);
            if (expectedPrice > 0) {
              const tolerance = expectedPrice * 0.05;
              priceDeviation = Math.abs(avgUnitPrice - expectedPrice) > tolerance;
            }
          }

          return {
            product_id: id,
            product_name: name,
            units_sold: units,
            revenue,
            cost,
            margin,
            hasRecipe: hasCost,
            priceDeviation,
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
