import type { Product } from "@/data/products";

export type PriceType = "minorista" | "intermedio" | "mayorista";

export const WHOLESALE_MIN_QTY = 10;

/**
 * Single source of truth for unit price calculation.
 * Used by public web, admin, and reseller flows.
 */
export function getUnitPrice(
  product: Product,
  quantity: number,
  customerPriceType: PriceType = "minorista"
): number {
  if (customerPriceType === "mayorista") {
    return product.wholesalePrice ?? product.price;
  }
  if (customerPriceType === "intermedio") {
    return product.intermediatePrice ?? product.price;
  }
  // minorista: wholesale kicks in at >= 10 units
  if (quantity >= WHOLESALE_MIN_QTY && product.wholesalePrice) {
    return product.wholesalePrice;
  }
  return product.price;
}
