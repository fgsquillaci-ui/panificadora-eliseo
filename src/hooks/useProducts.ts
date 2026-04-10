import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { products as fallbackProducts, type Product } from "@/data/products";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");

      if (error || !data || data.length === 0) {
        console.warn("Falling back to local products", error);
        return fallbackProducts.filter(p => p.price > 0);
      }

      return data.filter(p => p.retail_price != null || p.wholesale_price != null).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        price: p.retail_price ?? p.wholesale_price ?? 0,
        wholesalePrice: p.wholesale_price ?? undefined,
        intermediatePrice: (p as any).intermediate_price ?? undefined,
        minQtyMidTier: (p as any).min_qty_mid_tier ?? undefined,
        minQtyWholesale: (p as any).min_qty_wholesale ?? undefined,
        unit: p.unit ?? undefined,
        category: p.category as Product["category"],
        emoji: p.emoji,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}
