import type { Product } from "@/data/products";

export type PriceType = "minorista" | "intermedio" | "mayorista";

export const WHOLESALE_MIN_QTY = 10;

/**
 * Determine which pricing tier applies for a given product, quantity, and customer type.
 */
export function getPricingTier(
  product: Product,
  quantity: number,
  customerPriceType: PriceType = "minorista"
): PriceType {
  if (customerPriceType === "mayorista") return "mayorista";
  if (customerPriceType === "intermedio") return "intermedio";

  // minorista: tier determined by quantity thresholds
  const minWholesale = product.minQtyWholesale ?? WHOLESALE_MIN_QTY;
  const minMidTier = product.minQtyMidTier ?? 1;

  if (quantity >= minWholesale && product.wholesalePrice) {
    return "mayorista";
  }
  if (quantity >= minMidTier && minMidTier > 1) {
    // Only apply mid-tier if there's a meaningful threshold (> 1)
    const midPrice = product.intermediatePrice
      ?? (product.wholesalePrice
        ? Math.round((product.price + product.wholesalePrice) / 2)
        : null);
    if (midPrice) return "intermedio";
  }
  return "minorista";
}

/**
 * Single source of truth for unit price calculation.
 * Used by public web, admin, and reseller flows.
 */
export function getUnitPrice(
  product: Product,
  quantity: number,
  customerPriceType: PriceType = "minorista"
): number {
  const tier = getPricingTier(product, quantity, customerPriceType);

  if (tier === "mayorista") {
    return product.wholesalePrice ?? product.price;
  }
  if (tier === "intermedio") {
    return product.intermediatePrice
      ?? (product.wholesalePrice
        ? Math.round((product.price + product.wholesalePrice) / 2)
        : product.price);
  }
  return product.price;
}
