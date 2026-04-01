import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, format } from "date-fns";
import type { TierFilter } from "./useProductProfitability";

export type Period = "hoy" | "semana" | "mes" | "todo" | "custom";

export interface CustomRange {
  from: string;
  to: string;
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

export function useFinancialData(period: Period, tierFilter: TierFilter = null, customRange?: CustomRange) {
  const [revenue, setRevenue] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [realCost, setRealCost] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [cashMovements, setCashMovements] = useState<any[]>([]);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsMissingCost, setItemsMissingCost] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    const start = getPeriodStart(period, customRange);
    const startDate = format(new Date(start), "yyyy-MM-dd");
    const end = period === "custom" && customRange ? customRange.to : undefined;
    const endDate = end ? format(new Date(end), "yyyy-MM-dd") : undefined;

    let itemsQuery = supabase
      .from("order_items")
      .select("product_id, total, unit_price, quantity, cost_snapshot, pricing_tier_applied, orders!inner(status, created_at)")
      .eq("orders.status", "entregado" as any)
      .gte("orders.created_at", start);

    if (end) itemsQuery = itemsQuery.lte("orders.created_at", end);
    if (tierFilter) itemsQuery = itemsQuery.eq("pricing_tier_applied", tierFilter);

    let expensesQuery = supabase.from("expenses").select("*").gte("date", startDate).order("date", { ascending: false });
    if (endDate) expensesQuery = expensesQuery.lte("date", endDate);

    let cashQuery = supabase.from("cash_movements").select("*").gte("date", startDate).order("date", { ascending: false });
    if (endDate) cashQuery = cashQuery.lte("date", endDate);

    const [itemsRes, expensesRes, cashRes, productsRes] = await Promise.all([
      itemsQuery,
      expensesQuery,
      cashQuery,
      supabase.from("products").select("id, unit_cost"),
    ]);

    const items = (itemsRes.data || []) as any[];

    // Build product unit_cost map
    const costMap: Record<string, number> = {};
    (productsRes.data || []).forEach((p: any) => { costMap[p.id] = p.unit_cost ?? 0; });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalRealCost = 0;
    let totalMissingCost = 0;
    items.forEach((item) => {
      const qty = item.quantity ?? 0;
      const itemTotal = item.total && item.total > 0 ? item.total : (item.unit_price ?? 0) * qty;
      totalRevenue += itemTotal;

      const unitCost = costMap[item.product_id] ?? 0;
      if (unitCost > 0) {
        totalCost += unitCost * qty;
      }

      // Real cost from FIFO cost_snapshot (total line cost)
      const costSnap = item.cost_snapshot;
      if (costSnap === null || costSnap === undefined) {
        totalMissingCost++;
      } else {
        totalRealCost += costSnap;
      }
    });

    const totalExpenses = (expensesRes.data || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    setRevenue(totalRevenue);
    setEstimatedCost(totalCost);
    setRealCost(totalRealCost);
    setExpenses(totalExpenses);
    setExpensesList(expensesRes.data || []);
    setCashMovements(cashRes.data || []);
    setItemsMissingCost(totalMissingCost);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [period, tierFilter, customRange?.from, customRange?.to]);

  useEffect(() => {
    const ch1 = supabase.channel("fin-expenses").on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchData).subscribe();
    const ch2 = supabase.channel("fin-cash").on("postgres_changes", { event: "*", schema: "public", table: "cash_movements" }, fetchData).subscribe();
    const ch3 = supabase.channel("fin-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchData).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3); };
  }, [period, tierFilter, customRange?.from, customRange?.to]);

  const totalCashIn = cashMovements.filter(m => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
  const totalCashOut = cashMovements.filter(m => m.type !== "ingreso").reduce((s, m) => s + m.amount, 0);
  const totalWithdrawals = cashMovements.filter(m => m.type === "retiro").reduce((s, m) => s + m.amount, 0);

  const realProfit = revenue - realCost - expenses;
  const realMargin = revenue > 0
    ? ((revenue - realCost) / revenue) * 100
    : null;
  const realCostMissing = realCost === 0 && revenue > 0;
  const hasPartialMissingCost = realCost > 0 && itemsMissingCost > 0;

  return { revenue, estimatedCost, realCost, realProfit, realMargin, realCostMissing, expenses, expensesList, cashMovements, totalCashIn, totalCashOut, totalWithdrawals, loading, refetch: fetchData, itemsMissingCost, hasPartialMissingCost };
}
