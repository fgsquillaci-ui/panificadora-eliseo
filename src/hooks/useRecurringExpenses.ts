import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, eachDayOfInterval, getDay, getDate, parseISO } from "date-fns";
import type { Period, CustomRange } from "./useFinancialData";

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number | null;
  frequency: "monthly" | "weekly";
  day_of_month: number | null;
  day_of_week: number | null;
  start_date: string;
  active: boolean;
  estimated: boolean;
  user_id: string;
  created_at: string;
}

export type RecurringExpenseInput = {
  name: string;
  amount: number | null;
  frequency: "monthly" | "weekly";
  day_of_month: number | null;
  day_of_week: number | null;
  start_date: string;
  active: boolean;
  estimated: boolean;
};

function validateInput(input: RecurringExpenseInput): string | null {
  if (!input.name.trim()) return "El nombre es requerido";
  if (input.estimated === true && (input.amount === null || input.amount <= 0)) return "Los gastos estimados requieren un monto";
  if (!["monthly", "weekly"].includes(input.frequency)) return "Frecuencia inválida";
  if (input.frequency === "monthly") {
    if (input.day_of_month === null || input.day_of_month < 1 || input.day_of_month > 31) return "Día del mes inválido (1-31)";
    if (input.day_of_week !== null) return "Día de la semana debe ser nulo para frecuencia mensual";
  }
  if (input.frequency === "weekly") {
    if (input.day_of_week === null || input.day_of_week < 0 || input.day_of_week > 6) return "Día de la semana inválido (0-6)";
    if (input.day_of_month !== null) return "Día del mes debe ser nulo para frecuencia semanal";
  }
  return null;
}

function getPeriodRange(period: Period, customRange?: CustomRange): { from: Date; to: Date } {
  const now = new Date();
  if (period === "custom" && customRange) {
    return { from: parseISO(customRange.from), to: parseISO(customRange.to) };
  }
  switch (period) {
    case "hoy":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "semana":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "mes":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "todo":
      return { from: new Date("2020-01-01"), to: endOfMonth(now) };
    default:
      return { from: startOfDay(now), to: endOfDay(now) };
  }
}

function calcItemProjection(item: RecurringExpense, from: Date, to: Date): number {
  if (!item.active || item.amount === null || item.amount <= 0) return 0;
  const startDate = parseISO(item.start_date);
  const effectiveFrom = from > startDate ? from : startDate;
  if (effectiveFrom > to) return 0;

  const days = eachDayOfInterval({ start: effectiveFrom, end: to });

  if (item.frequency === "monthly" && item.day_of_month !== null) {
    return days.filter(d => getDate(d) === item.day_of_month).length * item.amount;
  } else if (item.frequency === "weekly" && item.day_of_week !== null) {
    return days.filter(d => getDay(d) === item.day_of_week).length * item.amount;
  }
  return 0;
}

export function calcProjectedForPeriod(
  items: RecurringExpense[],
  period: Period,
  customRange?: CustomRange
): number {
  const { from, to } = getPeriodRange(period, customRange);
  let total = 0;
  for (const item of items) {
    total += calcItemProjection(item, from, to);
  }
  return total;
}

export function calcProjectedBreakdown(
  items: RecurringExpense[],
  period: Period,
  customRange?: CustomRange
): { fixed: number; estimated: number; total: number } {
  const { from, to } = getPeriodRange(period, customRange);
  let fixed = 0;
  let estimated = 0;

  for (const item of items) {
    const projection = calcItemProjection(item, from, to);
    if (projection === 0) continue;
    if (item.estimated === true) {
      estimated += projection;
    } else {
      fixed += projection;
    }
  }

  return { fixed, estimated, total: fixed + estimated };
}

export function useRecurringExpenses() {
  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("recurring_expenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setItems((data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const ch = supabase
      .channel("recurring-expenses")
      .on("postgres_changes", { event: "*", schema: "public", table: "recurring_expenses" }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  const create = async (input: RecurringExpenseInput) => {
    const err = validateInput(input);
    if (err) { toast.error(err); return false; }
    if (!user) { toast.error("No autenticado"); return false; }

    const { error } = await supabase.from("recurring_expenses").insert({
      name: input.name,
      amount: input.amount,
      frequency: input.frequency,
      day_of_month: input.day_of_month,
      day_of_week: input.day_of_week,
      start_date: input.start_date,
      active: input.active,
      estimated: input.estimated,
      user_id: user.id,
    } as any);

    if (error) { toast.error("Error al crear gasto recurrente"); return false; }
    toast.success("Gasto recurrente creado");
    return true;
  };

  const update = async (id: string, input: RecurringExpenseInput) => {
    const err = validateInput(input);
    if (err) { toast.error(err); return false; }

    const { error } = await supabase.from("recurring_expenses").update({
      name: input.name,
      amount: input.amount,
      frequency: input.frequency,
      day_of_month: input.day_of_month,
      day_of_week: input.day_of_week,
      start_date: input.start_date,
      active: input.active,
      estimated: input.estimated,
    } as any).eq("id", id);

    if (error) { toast.error("Error al actualizar"); return false; }
    toast.success("Gasto recurrente actualizado");
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar"); return false; }
    toast.success("Gasto recurrente eliminado");
    return true;
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("recurring_expenses").update({ active } as any).eq("id", id);
    if (error) toast.error("Error al actualizar");
  };

  const fixedItems = items.filter(i => i.amount !== null && i.estimated !== true);
  const estimatedItems = items.filter(i => i.amount !== null && i.estimated === true);
  const variableItems = items.filter(i => i.amount === null);

  return { items, fixedItems, estimatedItems, variableItems, loading, create, update, remove, toggleActive, refetch: fetch };
}
