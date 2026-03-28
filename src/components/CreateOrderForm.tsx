import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import CustomerPicker from "@/components/CustomerPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { logOrderAction, logError } from "@/lib/orderHistory";
import { getUnitPrice, getPricingTier, type PriceType } from "@/lib/pricing";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface SelectedCustomer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  price_type: PriceType;
}

interface CreateOrderFormProps {
  createdBy: "admin" | "revendedor";
  resellerName: string | null;
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  { value: "efectivo", label: "💵 Efectivo" },
  { value: "transferencia", label: "🏦 Transferencia" },
  { value: "tarjeta", label: "💳 Tarjeta" },
];

const CreateOrderForm = ({ createdBy, resellerName, onSuccess }: CreateOrderFormProps) => {
  const { user } = useAuth();
  const { data: products, isLoading: productsLoading } = useProducts();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const customerPriceType = selectedCustomer?.price_type ?? "minorista";

  // Recalculate cart prices when customer changes
  const recalcCartForCustomer = useCallback(
    (priceType: PriceType, currentCart: CartItem[]) => {
      if (!products) return currentCart;
      return currentCart.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return item;
        return { ...item, price: getUnitPrice(product, item.quantity, priceType) };
      });
    },
    [products]
  );

  const handleCustomerSelect = (customer: SelectedCustomer | null) => {
    setSelectedCustomer(customer);
    if (customer?.address) setAddress(customer.address);
    // Recalculate prices for new customer type
    const priceType = customer?.price_type ?? "minorista";
    setCart((prev) => recalcCartForCustomer(priceType, prev));
  };

  const addToCart = (product: { id: string; name: string; price: number; wholesalePrice?: number; intermediatePrice?: number; emoji: string }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        const unitPrice = getUnitPrice(product as any, newQty, customerPriceType);
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: newQty, price: unitPrice } : i
        );
      }
      const unitPrice = getUnitPrice(product as any, 1, customerPriceType);
      return [...prev, { productId: product.id, name: product.name, price: unitPrice, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const product = products?.find((p) => p.id === productId);
      return prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const newQty = i.quantity + delta;
          if (newQty <= 0) return { ...i, quantity: 0 };
          const unitPrice = product ? getUnitPrice(product, newQty, customerPriceType) : i.price;
          return { ...i, quantity: newQty, price: unitPrice };
        })
        .filter((i) => i.quantity > 0);
    });
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const validateOrder = (): boolean => {
    if (!selectedCustomer) { toast.error("Seleccioná un cliente"); return false; }
    if (cart.length === 0) { toast.error("Agregá al menos un producto"); return false; }
    if (!paymentMethod) { toast.error("Seleccioná un método de pago"); return false; }
    const invalidItems = cart.filter((i) => i.quantity <= 0);
    if (invalidItems.length > 0) { toast.error("Hay productos con cantidad inválida"); return false; }
    const recalculated = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    if (recalculated !== total || total === 0) {
      toast.error("Error en el cálculo del total. Revisá el carrito.");
      logError("Total mismatch on order creation", { recalculated, total, cart });
      return false;
    }
    return true;
  };

  const handleReview = () => {
    if (validateOrder()) setShowConfirmation(true);
  };

  const handleSubmit = async () => {
    if (!user || !validateOrder()) return;

    setSaving(true);

    // Fetch recipes + ingredient costs for snapshots BEFORE creating order
    const { data: recipes } = await supabase.from("recipes").select("product_id, quantity, ingredients(costo_unitario)");
    const costMap: Record<string, number> = {};
    (recipes || []).forEach((r: any) => {
      const pid = r.product_id;
      costMap[pid] = (costMap[pid] || 0) + Number(r.quantity) * (r.ingredients?.costo_unitario || 0);
    });

    // Pre-validate snapshots
    const itemsWithSnapshots = cart.map((i) => {
      const product = products?.find((p) => p.id === i.productId);
      const tier = product ? getPricingTier(product, i.quantity, customerPriceType) : null;
      const unitCost = costMap[i.productId] || 0;
      const marginPct = i.price > 0 ? ((i.price - unitCost) / i.price) * 100 : 0;
      return { ...i, tier, unitCost, marginPct };
    });

    // Block if critical snapshot data is missing
    const invalidItems = itemsWithSnapshots.filter((i) => !i.productId || i.price <= 0 || !i.tier);
    if (invalidItems.length > 0) {
      toast.error("Hay productos sin datos completos. No se puede guardar el pedido.");
      logError("Snapshot validation failed — missing critical data", {
        invalidItems: invalidItems.map((i) => ({ name: i.name, productId: i.productId, price: i.price, tier: i.tier })),
      });
      setSaving(false);
      return;
    }

    // Warn (don't block) if cost is 0 (product without recipe)
    const zeroCostItems = itemsWithSnapshots.filter((i) => i.unitCost === 0);
    if (zeroCostItems.length > 0) {
      toast.warning(`${zeroCostItems.length} producto(s) sin costo de receta. El margen se guardará como 0.`);
      logError("Snapshot warning — zero cost items", {
        items: zeroCostItems.map((i) => i.name),
      });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: selectedCustomer!.name,
        customer_phone: selectedCustomer!.phone || null,
        customer_id: selectedCustomer!.id,
        address: address.trim() || null,
        delivery_type: address.trim() ? "delivery" : "retiro",
        total,
        status: "pendiente" as any,
        user_id: user.id,
        created_by: createdBy,
        reseller_name: resellerName,
        payment_method: paymentMethod,
      } as any)
      .select("id")
      .single();

    if (error || !order) {
      toast.error("Error al crear pedido");
      logError("Order creation failed", { error, customer: selectedCustomer?.name });
      setSaving(false);
      return;
    }

    const items = itemsWithSnapshots.map((i) => ({
      order_id: order.id,
      product_name: i.name,
      quantity: i.quantity,
      unit_price: i.price,
      total: i.price * i.quantity,
      product_id: i.productId,
      cost_snapshot: i.unitCost,
      margin_snapshot: Math.round(i.marginPct * 10) / 10,
      pricing_tier_applied: i.tier,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(items);
    if (itemsError) {
      toast.error("Error al guardar productos del pedido");
      logError("Order items insert failed", { error: itemsError, orderId: order.id });
    } else {
      toast.success("¡Pedido creado!");
      logOrderAction(order.id, "created", null, `total:${total}`);
      onSuccess();
    }
    setSaving(false);
  };

  if (productsLoading) {
    return <p className="font-body text-sm text-muted-foreground animate-pulse">Cargando productos...</p>;
  }

  if (showConfirmation) {
    const paymentLabel = PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ?? paymentMethod;
    return (
      <div className="space-y-4">
        <h3 className="font-display text-lg font-semibold">Confirmar pedido</h3>
        <div className="rounded-lg border bg-secondary/20 p-4 space-y-3">
          <div className="space-y-1">
            <p className="font-body text-xs text-muted-foreground">Cliente</p>
            <p className="font-body text-sm font-semibold">{selectedCustomer?.name}</p>
            {selectedCustomer?.phone && <p className="font-body text-xs text-muted-foreground">{selectedCustomer.phone}</p>}
          </div>
          <div className="space-y-1">
            <p className="font-body text-xs text-muted-foreground">Entrega</p>
            <p className="font-body text-sm">{address.trim() ? `📍 ${address}` : "🏪 Retiro en local"}</p>
          </div>
          <div className="space-y-1">
            <p className="font-body text-xs text-muted-foreground">Método de pago</p>
            <p className="font-body text-sm">{paymentLabel}</p>
          </div>
          <div className="border-t pt-2 space-y-1.5">
            <p className="font-body text-xs text-muted-foreground">Productos</p>
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between font-body text-sm">
                <span>{item.name} ×{item.quantity}</span>
                <span className="font-semibold">${(item.price * item.quantity).toLocaleString("es-AR")}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-body text-sm font-bold">Total</span>
            <span className="font-body text-sm font-bold">${total.toLocaleString("es-AR")}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowConfirmation(false)} className="flex-1 gap-1.5 font-body">
            <ArrowLeft className="w-4 h-4" /> Editar
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="flex-1 gap-1.5 font-body">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? "Guardando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <CustomerPicker
        selectedCustomer={selectedCustomer}
        onSelect={handleCustomerSelect}
        createdBy={createdBy}
        resellerId={createdBy === "revendedor" ? user?.id || null : null}
      />

      <div className="space-y-1.5">
        <Label className="font-body text-xs">Dirección (vacío = retiro en local)</Label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Corrientes 1234" />
      </div>

      <div className="space-y-1.5">
        <Label className="font-body text-xs font-semibold">Método de pago *</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Seleccionar método de pago" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="font-body text-xs font-semibold">Productos</Label>
        {selectedCustomer && customerPriceType !== "minorista" && (
          <p className="font-body text-[10px] text-primary font-semibold">
            💰 Precio {customerPriceType} aplicado
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(products || []).map((p) => {
            const inCart = cart.find((i) => i.productId === p.id);
            const qty = inCart?.quantity ?? 1;
            const displayPrice = getUnitPrice(p, qty, customerPriceType);
            const tier = getPricingTier(p, qty, customerPriceType);
            const tierLabel = tier === "mayorista" ? "💰 Mayorista" : tier === "intermedio" ? "📦 Intermedio" : null;
            return (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className={`text-left rounded-lg border p-2.5 transition-colors hover:bg-secondary/60 ${
                  inCart ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <span className="text-lg">{p.emoji}</span>
                <p className="font-body text-xs font-medium truncate">{p.name}</p>
                <p className="font-body text-[10px] text-muted-foreground">${displayPrice.toLocaleString("es-AR")}</p>
                {inCart && (
                  <p className="font-body text-[10px] text-primary font-semibold">×{inCart.quantity}</p>
                )}
                {inCart && tierLabel && (
                  <p className="font-body text-[9px] font-semibold text-accent-foreground bg-accent rounded px-1 mt-0.5 inline-block">{tierLabel}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="rounded-lg border bg-secondary/20 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-body font-semibold text-muted-foreground">
            <ShoppingCart className="w-3.5 h-3.5" /> Carrito
          </div>
          {cart.map((item) => (
            <div key={item.productId} className="flex items-center justify-between gap-2">
              <span className="font-body text-xs flex-1 truncate">{item.name}</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive/20">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-body text-xs w-5 text-center font-semibold">{item.quantity}</span>
                <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <span className="font-body text-xs font-semibold w-16 text-right">
                ${(item.price * item.quantity).toLocaleString("es-AR")}
              </span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between">
            <span className="font-body text-sm font-bold">Total</span>
            <span className="font-body text-sm font-bold">${total.toLocaleString("es-AR")}</span>
          </div>
        </div>
      )}

      <Button onClick={handleReview} className="w-full gap-2 font-body">
        <ShoppingCart className="w-4 h-4" /> Revisar pedido
      </Button>
    </div>
  );
};

export default CreateOrderForm;
