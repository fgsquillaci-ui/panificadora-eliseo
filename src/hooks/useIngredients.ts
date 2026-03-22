import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  created_at: string;
}

export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data } = await supabase.from("ingredients").select("*").order("name");
    setIngredients((data as Ingredient[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const ch = supabase.channel("rt-ingredients").on("postgres_changes", { event: "*", schema: "public", table: "ingredients" }, fetch).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  const create = async (values: Omit<Ingredient, "id" | "created_at">) => {
    const { error } = await supabase.from("ingredients").insert(values);
    if (error) { toast.error("Error al crear ingrediente"); return false; }
    toast.success("Ingrediente creado");
    return true;
  };

  const update = async (id: string, values: Partial<Ingredient>) => {
    const { error } = await supabase.from("ingredients").update(values).eq("id", id);
    if (error) { toast.error("Error al actualizar"); return false; }
    toast.success("Ingrediente actualizado");
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("ingredients").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar"); return false; }
    toast.success("Ingrediente eliminado");
    return true;
  };

  const lowStock = ingredients.filter(i => i.stock_actual <= i.stock_minimo && i.stock_minimo > 0);

  return { ingredients, loading, create, update, remove, lowStock, refetch: fetch };
}
