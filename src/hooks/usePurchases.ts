import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cascadeResync } from "./useBatches";

export interface Purchase {
  id: string;
  ingredient_id: string;
  quantity: number;
  unit_price: number; // pesos
  total_cost: number; // pesos
  date: string;
  supplier: string;
  created_at: string;
}

export function usePurchases(ingredientId?: string) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = useCallback(async () => {
    let query = supabase
      .from("ingredient_batches")
      .select("*")
      .order("purchase_date", { ascending: false });
    if (ingredientId) query = query.eq("ingredient_id", ingredientId);
    const { data } = await query;
    const mapped: Purchase[] = (data || []).map((b: any) => ({
      id: b.id,
      ingredient_id: b.ingredient_id,
      quantity: Number(b.quantity_total),
      unit_price: Number(b.unit_cost),
      total_cost: Number(b.quantity_total) * Number(b.unit_cost),
      date: b.purchase_date,
      supplier: b.supplier || "",
      created_at: b.created_at,
    }));
    setPurchases(mapped);
    setLoading(false);
  }, [ingredientId]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  useEffect(() => {
    const ch = supabase.channel(`rt-purchases-${ingredientId || "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredient_batches" }, fetchPurchases)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchPurchases, ingredientId]);

  const create = async (values: { ingredient_id: string; quantity: number; unit_price: number; date: string }) => {
    // unit_price comes in cents from the form, convert to pesos for batch
    const unitCostPesos = values.unit_price / 100;

    const { data: ing } = await supabase.from("ingredients").select("costo_unitario").eq("id", values.ingredient_id).single();

    const { error: batchError } = await supabase.from("ingredient_batches").insert({
      ingredient_id: values.ingredient_id,
      quantity_total: values.quantity,
      quantity_remaining: values.quantity,
      unit_cost: unitCostPesos,
      purchase_date: values.date,
      supplier: "",
    });

    if (batchError) {
      console.error("Error creating batch:", batchError);
      toast.error("Error al registrar compra");
      return false;
    }

    if (ing) {
      await cascadeResync(values.ingredient_id);

      const { data: updatedIng } = await supabase.from("ingredients").select("costo_unitario").eq("id", values.ingredient_id).single();
      if (updatedIng) {
        await supabase.from("raw_material_cost_history" as any).insert({
          ingredient_id: values.ingredient_id,
          old_cost: ing.costo_unitario,
          new_cost: updatedIng.costo_unitario,
        });
      }
    }

    toast.success("Compra registrada y stock actualizado");
    return true;
  };

  const remove = async (id: string) => {
    // Get batch to know ingredient_id for resync
    const { data: batch } = await supabase.from("ingredient_batches").select("ingredient_id").eq("id", id).single();
    const { error } = await supabase.from("ingredient_batches").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar compra"); return false; }
    if (batch) await cascadeResync(batch.ingredient_id);
    toast.success("Compra eliminada");
    return true;
  };

  // Weighted average cost in pesos
  const weightedAvgCost = purchases.length > 0
    ? purchases.reduce((sum, p) => sum + p.total_cost, 0) / purchases.reduce((sum, p) => sum + p.quantity, 0)
    : 0;

  return { purchases, loading, create, remove, weightedAvgCost, refetch: fetchPurchases };
}
