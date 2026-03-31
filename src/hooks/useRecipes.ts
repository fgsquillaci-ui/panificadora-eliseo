import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RecipeRow {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity: number;
}

export interface RecipeWithIngredient extends RecipeRow {
  ingredient_name: string;
  ingredient_unit: string;
  ingredient_cost: number;
  line_cost: number;
}

async function syncProductUnitCost(productId: string) {
  const { data } = await supabase
    .from("recipes")
    .select("quantity, ingredients(costo_unitario)")
    .eq("product_id", productId);
  const cost = (data || []).reduce((s, r: any) => {
    const costoUnitario = r.ingredients?.costo_unitario || 0;
    return s + Number(r.quantity) * (costoUnitario / 100);
  }, 0);
  await supabase
    .from("products")
    .update({ unit_cost: Math.round(cost) } as any)
    .eq("id", productId);
}

export function useRecipes(productId?: string) {
  const [recipes, setRecipes] = useState<RecipeWithIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!productId) { setRecipes([]); setLoading(false); return; }
    const { data } = await supabase.from("recipes").select("*, ingredients(name, unit, costo_unitario)").eq("product_id", productId);
    const mapped = (data || []).map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      ingredient_id: r.ingredient_id,
      quantity: Number(r.quantity),
      ingredient_name: r.ingredients?.name || "",
      ingredient_unit: r.ingredients?.unit || "",
      ingredient_cost: (r.ingredients?.costo_unitario || 0) / 100,
      line_cost: Number(r.quantity) * ((r.ingredients?.costo_unitario || 0) / 100),
    }));
    setRecipes(mapped);
    setLoading(false);
  }, [productId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addLine = async (ingredient_id: string, quantity: number) => {
    if (!productId) return false;
    const { error } = await supabase.from("recipes").insert({ product_id: productId, ingredient_id, quantity });
    if (error) { toast.error("Error al agregar ingrediente a receta"); return false; }
    await fetch();
    await syncProductUnitCost(productId);
    return true;
  };

  const updateLine = async (id: string, quantity: number) => {
    const { error } = await supabase.from("recipes").update({ quantity }).eq("id", id);
    if (error) { toast.error("Error al actualizar"); return false; }
    await fetch();
    if (productId) await syncProductUnitCost(productId);
    return true;
  };

  const removeLine = async (id: string) => {
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar"); return false; }
    await fetch();
    if (productId) await syncProductUnitCost(productId);
    return true;
  };

  const totalCost = recipes.reduce((s, r) => s + r.line_cost, 0);

  return { recipes, loading, addLine, updateLine, removeLine, totalCost, refetch: fetch };
}
