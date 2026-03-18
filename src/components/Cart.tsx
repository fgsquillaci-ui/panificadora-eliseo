import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, Plus, Minus, Trash2, MessageCircle } from "lucide-react";
import type { CartItem } from "@/hooks/useCart";
import { getEffectivePrice, WHOLESALE_MIN_QTY } from "@/data/products";

interface Props {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  bounceKey: number;
  isOpen: boolean;
  onToggle: () => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onClear: () => void;
  whatsAppUrl: string;
}

const Cart = ({
  items,
  totalItems,
  totalPrice,
  bounceKey,
  isOpen,
  onToggle,
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  whatsAppUrl,
}: Props) => {
  return (
    <>
      {/* Floating cart button */}
      <motion.button
        key={bounceKey}
        animate={bounceKey > 0 ? { scale: [1, 1.25, 1] } : {}}
        transition={{ duration: 0.3 }}
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 bg-accent text-accent-foreground w-16 h-16 rounded-full shadow-xl flex items-center justify-center hover:brightness-110 transition-all"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 bg-whatsapp text-whatsapp-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </motion.button>

      {/* Cart drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onToggle}
              className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-50 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="font-display font-bold text-xl">Tu pedido</h2>
                <button onClick={onToggle} className="p-2 hover:bg-secondary rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {items.length === 0 ? (
                  <div className="text-center text-muted-foreground py-16">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="font-body">Tu pedido está vacío</p>
                    <p className="text-sm mt-1">Agregá productos del catálogo</p>
                  </div>
                ) : (
                  items.map((item) => {
                    const effectivePrice = getEffectivePrice(item.product, item.quantity);
                    const isWholesale = item.quantity >= WHOLESALE_MIN_QTY && !!item.product.wholesalePrice;

                    return (
                      <motion.div
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-card rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.product.emoji}</span>
                            <div>
                              <h4 className="font-body font-semibold text-sm">{item.product.name}</h4>
                              <div className="flex items-center gap-2">
                                {isWholesale ? (
                                  <>
                                    <span className="text-muted-foreground text-xs line-through">
                                      ${item.product.price.toLocaleString("es-AR")}
                                    </span>
                                    <span className="text-accent text-xs font-semibold">
                                      ${effectivePrice.toLocaleString("es-AR")} c/u
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    ${effectivePrice.toLocaleString("es-AR")} c/u
                                  </span>
                                )}
                              </div>
                              {isWholesale && (
                                <span className="inline-block mt-1 text-[10px] font-body font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                                  Precio mayorista
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 bg-secondary rounded-full px-1 py-1">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-body font-semibold text-sm w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="font-body font-bold text-accent">
                            ${(effectivePrice * item.quantity).toLocaleString("es-AR")}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-body font-medium">Total</span>
                    <span className="font-display font-bold text-2xl">
                      ${totalPrice.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-whatsapp text-whatsapp-foreground font-body font-bold py-4 rounded-full text-lg hover:brightness-110 transition-all shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar pedido por WhatsApp
                  </a>
                  <button
                    onClick={onClear}
                    className="w-full text-muted-foreground font-body text-sm hover:text-foreground transition-colors py-2"
                  >
                    Vaciar pedido
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Cart;
