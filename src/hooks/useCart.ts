import { useState, useCallback } from "react";
import type { Product } from "@/data/products";
import { WHATSAPP_NUMBER } from "@/data/products";

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
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const getWhatsAppUrl = useCallback(() => {
    if (items.length === 0) return "";
    const lines = items.map(
      (i) => `- ${i.product.name} x${i.quantity} ($${(i.product.price * i.quantity).toLocaleString("es-AR")})`
    );
    const message = `Hola, quiero hacer el siguiente pedido:\n${lines.join("\n")}\nTotal: $${totalPrice.toLocaleString("es-AR")}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }, [items, totalPrice]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    bounceKey,
    getWhatsAppUrl,
  };
}
