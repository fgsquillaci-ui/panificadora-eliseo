import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Minus, ShoppingCart, Loader2 } from "lucide-react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CreateOrderFormProps {
  createdBy: "admin" | "revendedor";
  resellerName: string | null;
  onSuccess: () => void;
}

const CreateOrderForm = ({ createdBy, resellerName, onSuccess }: CreateOrderFormProps) => {
  const { user } = useAuth();
  const { data: products, isLoading: productsLoading } = useProducts();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const addToCart = (product: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleSubmit = async () => {
    if (!user) return;
    if (!customerName.trim()) {
      toast.error("Ingresá el nombre del cliente");
      return;
    }
    if (cart.length === 0) {
      toast.error("Agregá al menos un producto");
      return;
    }

    setSaving(true);
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        customer_name: customerName.trim(),
        customer_phone: phone.trim() || null,
        address: address.trim() || null,
        delivery_type: address.trim() ? "delivery" : "retiro",
        total,
        status: "pendiente" as any,
        user_id: user.id,
        created_by: createdBy,
        reseller_name: resellerName,
      })
      .select("id")
      .single();

    if (error || !order) {
      toast.error("Error al crear pedido");
      setSaving(false);
      return;
    }

    const items = cart.map((i) => ({
      order_id: order.id,
      product_name: i.name,
      quantity: i.quantity,
      unit_price: i.price,
      total: i.price * i.quantity,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(items);
    if (itemsError) {
      toast.error("Error al guardar productos del pedido");
    } else {
      toast.success("¡Pedido creado!");
      onSuccess();
    }
    setSaving(false);
  };

  if (productsLoading) {
    return <p className="font-body text-sm text-muted-foreground animate-pulse">Cargando productos...</p>;
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Customer info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="font-body text-xs">Nombre del cliente *</Label>
          <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Juan Pérez" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-xs">Teléfono</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="11-2345-6789" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="font-body text-xs">Dirección (vacío = retiro en local)</Label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Corrientes 1234" />
      </div>

      {/* Product selector */}
      <div className="space-y-2">
        <Label className="font-body text-xs font-semibold">Productos</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(products || []).map((p) => {
            const inCart = cart.find((i) => i.productId === p.id);
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
                <p className="font-body text-[10px] text-muted-foreground">${p.price.toLocaleString("es-AR")}</p>
                {inCart && (
                  <p className="font-body text-[10px] text-primary font-semibold">×{inCart.quantity}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="rounded-lg border bg-secondary/20 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-body font-semibold text-muted-foreground">
            <ShoppingCart className="w-3.5 h-3.5" /> Carrito
          </div>
          {cart.map((item) => (
            <div key={item.productId} className="flex items-center justify-between gap-2">
              <span className="font-body text-xs flex-1 truncate">{item.name}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateQty(item.productId, -1)}
                  className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive/20"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-body text-xs w-5 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.productId, 1)}
                  className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20"
                >
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

      <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2 font-body">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
        {saving ? "Guardando..." : "Crear pedido"}
      </Button>
    </div>
  );
};

export default CreateOrderForm;
