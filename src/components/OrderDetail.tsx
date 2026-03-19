import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type OrderStatus = "pendiente" | "en_produccion" | "enviado" | "entregado";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface OrderDetailProps {
  orderId: string;
  customerName: string;
  customerPhone?: string | null;
  address?: string | null;
  addressReferences?: string | null;
  status: OrderStatus | string;
  total: number;
  deliveryType: string;
  createdAt: string;
  /** Extra content rendered in the header row (e.g. "Marcar entregado" button) */
  actions?: React.ReactNode;
}

const statusLabels: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  en_produccion: "En producción",
  enviado: "Enviado",
  entregado: "Entregado",
};

const statusColors: Record<OrderStatus, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  en_produccion: "bg-blue-100 text-blue-800",
  enviado: "bg-purple-100 text-purple-800",
  entregado: "bg-green-100 text-green-800",
};

const OrderDetail = ({
  orderId,
  customerName,
  customerPhone,
  address,
  addressReferences,
  status,
  total,
  deliveryType,
  createdAt,
  actions,
}: OrderDetailProps) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (open && !loaded) {
      supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .then(({ data }) => {
          setItems((data as OrderItem[]) || []);
          setLoaded(true);
        });
    }
  }, [open, loaded, orderId]);

  const st = status as OrderStatus;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card rounded-xl border overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-secondary/40 transition-colors">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-body font-semibold text-sm truncate">{customerName}</span>
                <Badge className={cn("border-0 text-[10px] font-body", statusColors[st] || "bg-muted text-muted-foreground")}>
                  {statusLabels[st] || status}
                </Badge>
              </div>
              <p className="font-body text-xs text-muted-foreground">
                {deliveryType === "delivery" ? "📍 Delivery" : "🏪 Retiro"}
                {" · "}${total.toLocaleString("es-AR")}
                {" · "}{new Date(createdAt).toLocaleDateString("es-AR")}
              </p>
            </div>
            <ChevronDown className={cn("w-4 h-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t px-4 pb-4 pt-3 space-y-3">
            {/* Contact & address */}
            <div className="space-y-1">
              {customerPhone && (
                <p className="font-body text-xs text-muted-foreground">📱 {customerPhone}</p>
              )}
              {address && (
                <p className="font-body text-xs text-muted-foreground">
                  📍 {address}
                  {addressReferences && ` — ${addressReferences}`}
                </p>
              )}
            </div>

            {/* Items table */}
            {!loaded ? (
              <p className="font-body text-xs text-muted-foreground animate-pulse">Cargando productos...</p>
            ) : items.length === 0 ? (
              <p className="font-body text-xs text-muted-foreground">Sin productos registrados.</p>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs font-body">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Producto</th>
                      <th className="text-center px-2 py-2 font-medium text-muted-foreground">Cant.</th>
                      <th className="text-right px-2 py-2 font-medium text-muted-foreground">P. Unit.</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2">{item.product_name}</td>
                        <td className="px-2 py-2 text-center">{item.quantity}</td>
                        <td className="px-2 py-2 text-right">${item.unit_price.toLocaleString("es-AR")}</td>
                        <td className="px-3 py-2 text-right font-semibold">${item.total.toLocaleString("es-AR")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-secondary/30">
                      <td colSpan={3} className="px-3 py-2 font-semibold text-right">Total</td>
                      <td className="px-3 py-2 text-right font-bold">${total.toLocaleString("es-AR")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Extra actions */}
            {actions && <div className="flex justify-end pt-1">{actions}</div>}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default OrderDetail;
