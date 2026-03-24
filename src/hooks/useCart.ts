import { useState, useCallback } from "react";
import type { Product } from "@/data/products";
import { WHATSAPP_NUMBER } from "@/data/products";
import { getUnitPrice, WHOLESALE_MIN_QTY } from "@/lib/pricing";
import type { Profile } from "@/hooks/useAuth";

export interface CartItem {
  product: Product;
  quantity: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [bounceKey, setBounceKey] = useState(0);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setBounceKey((k) => k + 1);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + getUnitPrice(i.product, i.quantity) * i.quantity,
    0
  );

  const getTotalPrice = useCallback(
    (profile: Profile | null) => {
      if (profile && profile.discount_percent > 0) {
        return Math.round(subtotal * (1 - profile.discount_percent / 100));
      }
      return subtotal;
    },
    [subtotal]
  );

  const getWhatsAppUrl = useCallback(
    (profile: Profile | null, checkoutData?: { deliveryType: "delivery" | "retiro"; address: string; references: string; pickupTime: string; customerName: string; customerPhone: string }) => {
      if (items.length === 0) return "";
      const total = getTotalPrice(profile);
      const lines = items.map((i) => {
        const effectivePrice = getEffectivePrice(i.product, i.quantity);
        const isWholesale = i.quantity >= WHOLESALE_MIN_QTY && i.product.wholesalePrice;
        const itemTotal = effectivePrice * i.quantity;
        return `- ${i.product.name} x${i.quantity} ($${itemTotal.toLocaleString("es-AR")})${isWholesale ? " [mayorista]" : ""}`;
      });

      const discountLine =
        profile && profile.discount_percent > 0
          ? `\n🏷️ Descuento cliente: ${profile.discount_percent}%`
          : "";

      let deliverySection = "";
      if (checkoutData) {
        if (checkoutData.deliveryType === "delivery") {
          deliverySection = `📍 Entrega: Delivery\n- Dirección: ${checkoutData.address}${checkoutData.references ? `\n- Referencias: ${checkoutData.references}` : ""}`;
        } else {
          deliverySection = `📍 Entrega: Retiro en local\n- Horario estimado: ${checkoutData.pickupTime}`;
        }
      }

      const customerSection = checkoutData
        ? `👤 Nombre: ${checkoutData.customerName}\n📞 Teléfono: ${checkoutData.customerPhone}`
        : "";

      const message = `Hola, quiero realizar el siguiente pedido:\n\n🛒 Pedido:\n${lines.join("\n")}${discountLine}\n\n💰 Total: $${total.toLocaleString("es-AR")}\n\n${deliverySection}\n\n${customerSection}\n\nGracias 🙌`;
      return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
    },
    [items, getTotalPrice]
  );

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    getTotalPrice,
    bounceKey,
    getWhatsAppUrl,
  };
}
