import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfDay, startOfMonth, format } from "date-fns";

export interface Expense {
  id: string;
  amount: number;
  date: string;
  category: string;
  type: string;
  description: string;
  payment_method: string;
  supplier: string;
  ingredient_id: string | null;
  quantity: number | null;
  unit_price: number | null;
  batch_id: string | null;
  created_at: string;
}

const CATEGORIES = [
  { value: "materia_prima", label: "Materia Prima" },
  { value: "alquiler", label: "Alquiler" },
  { value: "sueldos", label: "Sueldos" },
  { value: "servicios", label: "Servicios" },
  { value: "transporte", label: "Transporte" },
  { value: "packaging", label: "Packaging" },
  { value: "gastos_personales", label: "Gastos personales" },
  { value: "otros", label: "Otros" },
] as const;

export { CATEGORIES };

export function useExpenses(categoryFilter?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    let query = supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (categoryFilter) {
      query = query.eq("category", categoryFilter);
    }

    const { data } = await query;
    setExpenses((data as unknown as Expense[]) || []);
    setLoading(false);
  }, [categoryFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const ch = supabase
      .channel("rt-expenses")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  const invokeEdge = async (payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("No autenticado"); return false; }

    const resp = await supabase.functions.invoke("manage-expense", {
      body: payload,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (resp.error || resp.data?.error) {
      toast.error(resp.data?.error || resp.error?.message || "Error");
      return false;
    }
    return true;
  };

  const create = async (data: Record<string, unknown>) => {
    const ok = await invokeEdge({ action: "create", ...data });
    if (ok) toast.success("Gasto registrado");
    return ok;
  };

  const update = async (expenseId: string, data: Record<string, unknown>) => {
    const ok = await invokeEdge({ action: "update", expense_id: expenseId, ...data });
    if (ok) toast.success("Gasto actualizado");
    return ok;
  };

  const remove = async (expenseId: string) => {
    const ok = await invokeEdge({ action: "delete", expense_id: expenseId });
    if (ok) toast.success("Gasto eliminado");
    return ok;
  };

  // Computed metrics
  const today = format(startOfDay(new Date()), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

  const totalMonth = expenses
    .filter(e => e.date >= monthStart)
    .reduce((s, e) => s + (e.amount || 0), 0);

  const totalToday = expenses
    .filter(e => e.date === today)
    .reduce((s, e) => s + (e.amount || 0), 0);

  return { expenses, loading, create, update, remove, totalMonth, totalToday, refetch: fetch };
}
