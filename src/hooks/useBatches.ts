import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Batch {
  id: string;
  ingredient_id: string;
  quantity_total: number;
  quantity_remaining: number;
  unit_cost: number; // pesos
  purchase_date: string;
  supplier: string;
  created_at: string;
}

/**
 * Recalculate ingredient stock and cost from remaining batches,
 * then resync unit_cost for all products using this ingredient.
 */
export async function cascadeResync(ingredientId: string) {
  // 1. Recalc stock_actual from batches
  const { data: batches } = await supabase
    .from("ingredient_batches")
    .select("quantity_remaining, unit_cost")
    .eq("ingredient_id", ingredientId)
    .gt("quantity_remaining", 0);

  const remaining = batches || [];
  const totalStock = remaining.reduce((s, b) => s + Number(b.quantity_remaining), 0);
  const totalValue = remaining.reduce((s, b) => s + Number(b.quantity_remaining) * Number(b.unit_cost), 0);
  const weightedAvgPesos = totalStock > 0 ? totalValue / totalStock : 0;
  // costo_unitario is stored in cents
  const costoUnitarioCents = Math.round(weightedAvgPesos * 100);

  // 2. Update ingredient
  await supabase
    .from("ingredients")
    .update({ stock_actual: totalStock, costo_unitario: costoUnitarioCents })
    .eq("id", ingredientId);

  // 3. Find affected products via recipes
  const { data: recipeRows } = await supabase
    .from("recipes")
    .select("product_id")
    .eq("ingredient_id", ingredientId);

  const productIds = [...new Set((recipeRows || []).map(r => r.product_id))];

  // 4. Recalc unit_cost for each affected product
  for (const productId of productIds) {
    const { data: recipeLines } = await supabase
      .from("recipes")
      .select("quantity, ingredients(costo_unitario)")
      .eq("product_id", productId);

    const unitCost = (recipeLines || []).reduce((s, r: any) => {
      const costoUnitario = r.ingredients?.costo_unitario || 0;
      return s + Number(r.quantity) * (costoUnitario / 100);
    }, 0);

    await supabase
      .from("products")
      .update({ unit_cost: Math.round(unitCost) } as any)
      .eq("id", productId);
  }
}

export function useBatches(ingredientId?: string) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    if (!ingredientId) { setBatches([]); setLoading(false); return; }
    const { data } = await supabase
      .from("ingredient_batches")
      .select("*")
      .eq("ingredient_id", ingredientId)
      .gt("quantity_remaining", 0)
      .order("purchase_date", { ascending: true })
      .order("created_at", { ascending: true });

    setBatches((data as Batch[]) || []);
    setLoading(false);
  }, [ingredientId]);

  useEffect(() => { fetchBatches(); }, [fetchBatches]);

  // Realtime
  useEffect(() => {
    if (!ingredientId) return;
    const ch = supabase
      .channel(`rt-batches-${ingredientId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredient_batches" }, fetchBatches)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchBatches, ingredientId]);

  /**
   * FIFO consumption: deduct neededQty from oldest batches.
   * Returns total cost in pesos.
   * Throws error if insufficient stock.
   */
  const consumeFIFO = async (ingId: string, neededQty: number): Promise<number> => {
    const { data: available } = await supabase
      .from("ingredient_batches")
      .select("id, quantity_remaining, unit_cost")
      .eq("ingredient_id", ingId)
      .gt("quantity_remaining", 0)
      .order("purchase_date", { ascending: true })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    let remaining = neededQty;
    let totalCost = 0;

    for (const batch of (available || [])) {
      if (remaining <= 0) break;
      const consume = Math.min(Number(batch.quantity_remaining), remaining);
      totalCost += consume * Number(batch.unit_cost);
      remaining -= consume;

      await supabase
        .from("ingredient_batches")
        .update({ quantity_remaining: Number(batch.quantity_remaining) - consume })
        .eq("id", batch.id);
    }

    if (remaining > 0) {
      throw new Error(`Stock insuficiente (faltan ${remaining})`);
    }

    // Cascade resync after consumption
    await cascadeResync(ingId);

    return totalCost;
  };

  // Price variation alert
  const priceVariation = (() => {
    if (batches.length < 2) return null;
    const oldest = batches[0].unit_cost;
    const newest = batches[batches.length - 1].unit_cost;
    if (oldest <= 0) return null;
    const pct = Math.abs(newest - oldest) / oldest * 100;
    return pct > 20 ? pct : null;
  })();

  return { batches, loading, consumeFIFO, priceVariation, refetch: fetchBatches };
}
