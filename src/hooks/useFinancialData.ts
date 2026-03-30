import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, format } from "date-fns";
import type { TierFilter } from "./useProductProfitability";

export type Period = "hoy" | "semana" | "mes";

function getPeriodStart(period: Period): string {
  const now = new Date();
  switch (period) {
    case "hoy": return format(startOfDay(now), "yyyy-MM-dd'T'HH:mm:ss");
    case "semana": return format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss");
    case "mes": return format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss");
  }
}

export function useFinancialData(period: Period, tierFilter: TierFilter = null) {
  const [revenue, setRevenue] = useState(0);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [cashMovements, setCashMovements] = useState<any[]>([]);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const start = getPeriodStart(period);
    const startDate = format(new Date(start), "yyyy-MM-dd");

    let itemsQuery = supabase
      .from("order_items")
      .select("total, unit_price, quantity, cost_snapshot, pricing_tier_applied, orders!inner(status, created_at)")
      .eq("orders.status", "entregado" as any)
      .gte("orders.created_at", start);

    if (tierFilter) {
      itemsQuery = itemsQuery.eq("pricing_tier_applied", tierFilter);
    }

    const [itemsRes, expensesRes, cashRes] = await Promise.all([
      itemsQuery,
      supabase.from("expenses").select("*").gte("date", startDate).order("date", { ascending: false }),
      supabase.from("cash_movements").select("*").gte("date", startDate).order("date", { ascending: false }),
    ]);

    const items = (itemsRes.data || []) as any[];

    let totalRevenue = 0;
    let totalCost = 0;
    items.forEach((item) => {
      const qty = item.quantity ?? 0;
      const itemTotal = item.total && item.total > 0 ? item.total : (item.unit_price ?? 0) * qty;
      totalRevenue += itemTotal;

      const costSnap = item.cost_snapshot ?? 0;
      if (costSnap > 0) {
        totalCost += costSnap * qty;
      }
    });

    const totalExpenses = (expensesRes.data || []).reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    setRevenue(totalRevenue);
    setEstimatedCost(totalCost);
    setExpenses(totalExpenses);
    setExpensesList(expensesRes.data || []);
    setCashMovements(cashRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [period, tierFilter]);

  useEffect(() => {
    const ch1 = supabase.channel("fin-expenses").on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchData).subscribe();
    const ch2 = supabase.channel("fin-cash").on("postgres_changes", { event: "*", schema: "public", table: "cash_movements" }, fetchData).subscribe();
    const ch3 = supabase.channel("fin-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchData).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3); };
  }, [period, tierFilter]);

  const totalCashIn = cashMovements.filter(m => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
  const totalCashOut = cashMovements.filter(m => m.type !== "ingreso").reduce((s, m) => s + m.amount, 0);
  const totalWithdrawals = cashMovements.filter(m => m.type === "retiro").reduce((s, m) => s + m.amount, 0);

  return { revenue, estimatedCost, expenses, expensesList, cashMovements, totalCashIn, totalCashOut, totalWithdrawals, loading, refetch: fetchData };
}
