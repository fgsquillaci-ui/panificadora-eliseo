import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth, format } from "date-fns";

export type Period = "hoy" | "semana" | "mes";

function getPeriodStart(period: Period): string {
  const now = new Date();
  switch (period) {
    case "hoy": return format(startOfDay(now), "yyyy-MM-dd'T'HH:mm:ss");
    case "semana": return format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd'T'HH:mm:ss");
    case "mes": return format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss");
  }
}

export function useFinancialData(period: Period) {
  const [revenue, setRevenue] = useState(0);
  const [productCosts, setProductCosts] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [cashMovements, setCashMovements] = useState<any[]>([]);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const start = getPeriodStart(period);
    const startDate = format(new Date(start), "yyyy-MM-dd");

    // 1. Get delivered order IDs for period
    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .eq("status", "entregado")
      .gte("created_at", start);

    const orderIds = (orders || []).map(o => o.id);

    let totalRevenue = 0;
    let totalProductCosts = 0;

    if (orderIds.length > 0) {
      // 2. Revenue & costs from order_items (SSOT)
      const { data: items } = await supabase
        .from("order_items")
        .select("total, quantity, cost_snapshot")
        .in("order_id", orderIds);

      (items || []).forEach((item) => {
        totalRevenue += item.total || 0;
        if (item.cost_snapshot != null && item.cost_snapshot > 0) {
          totalProductCosts += item.cost_snapshot * item.quantity;
        }
      });
    }

    // 3. Expenses & cash (unchanged)
    const [expensesRes, cashRes] = await Promise.all([
      supabase.from("expenses").select("*").gte("date", startDate).order("date", { ascending: false }),
      supabase.from("cash_movements").select("*").gte("date", startDate).order("date", { ascending: false }),
    ]);

    const totalExpenses = (expensesRes.data || []).reduce((sum, e) => sum + (e.amount || 0), 0);

    setRevenue(totalRevenue);
    setProductCosts(totalProductCosts);
    setExpenses(totalExpenses);
    setExpensesList(expensesRes.data || []);
    setCashMovements(cashRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  useEffect(() => {
    const ch1 = supabase.channel("fin-expenses").on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetchData).subscribe();
    const ch2 = supabase.channel("fin-cash").on("postgres_changes", { event: "*", schema: "public", table: "cash_movements" }, fetchData).subscribe();
    const ch3 = supabase.channel("fin-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchData).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); supabase.removeChannel(ch3); };
  }, [period]);

  const totalCashIn = cashMovements.filter(m => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
  const totalCashOut = cashMovements.filter(m => m.type !== "ingreso").reduce((s, m) => s + m.amount, 0);
  const totalWithdrawals = cashMovements.filter(m => m.type === "retiro").reduce((s, m) => s + m.amount, 0);

  return { revenue, productCosts, expenses, expensesList, cashMovements, totalCashIn, totalCashOut, totalWithdrawals, loading, refetch: fetchData };
}
