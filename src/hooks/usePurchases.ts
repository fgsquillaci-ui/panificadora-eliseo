import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Purchase {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  date: string;
  created_at: string;
}

export function usePurchases(ingredientId?: string) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = useCallback(async () => {
    let query = supabase.from("purchases").select("*").order("date", { ascending: false });
    if (ingredientId) query = query.eq("ingredient_id", ingredientId);
    const { data } = await query;
    setPurchases((data as Purchase[]) || []);
    setLoading(false);
  }, [ingredientId]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  useEffect(() => {
    const ch = supabase.channel(`rt-purchases-${ingredientId || "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "purchases" }, fetchPurchases)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchPurchases, ingredientId]);

  const create = async (values: { ingredient_id: string; quantity: number; unit_price: number; date: string }) => {
    const total_cost = Math.round(values.quantity * values.unit_price);
    const { data: inserted, error } = await supabase.from("purchases").insert({ ...values, total_cost }).select("id").single();
    if (error || !inserted) { toast.error("Error al registrar compra"); return false; }

    // Get current ingredient data
    const { data: ing } = await supabase.from("ingredients").select("stock_actual, costo_unitario").eq("id", values.ingredient_id).single();
    if (ing) {
      // Calculate new weighted average cost
      const oldCost = ing.costo_unitario;
      // Get all purchases for this ingredient to compute weighted avg
      const { data: allP } = await supabase.from("purchases").select("quantity, total_cost").eq("ingredient_id", values.ingredient_id);
      const totalSpent = (allP || []).reduce((s, p) => s + p.total_cost, 0);
      const totalQty = (allP || []).reduce((s, p) => s + Number(p.quantity), 0);
      const newCost = totalQty > 0 ? Math.round(totalSpent / totalQty) : oldCost;

      // Log cost history
      await supabase.from("raw_material_cost_history" as any).insert({
        ingredient_id: values.ingredient_id,
        purchase_id: inserted.id,
        old_cost: oldCost,
        new_cost: newCost,
      });

      // Update stock and cost
      await supabase.from("ingredients").update({
        stock_actual: ing.stock_actual + values.quantity,
        costo_unitario: newCost,
      }).eq("id", values.ingredient_id);
    }

    toast.success("Compra registrada y stock actualizado");
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("purchases").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar compra"); return false; }
    toast.success("Compra eliminada");
    return true;
  };

  // Weighted average cost calculation
  const weightedAvgCost = purchases.length > 0
    ? Math.round(purchases.reduce((sum, p) => sum + p.total_cost, 0) / purchases.reduce((sum, p) => sum + p.quantity, 0))
    : 0;

  return { purchases, loading, create, remove, weightedAvgCost, refetch: fetchPurchases };
}
