import { useState, useEffect } from "react";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Profile } from "@/hooks/useAuth";

export interface CheckoutData {
  deliveryType: "delivery" | "retiro";
  address: string;
  references: string;
  pickupTime: string;
  customerName: string;
  customerPhone: string;
}

interface Props {
  profile: Profile | null;
  whatsAppUrl: string;
  onBack: () => void;
  onDataChange: (data: CheckoutData) => void;
}

const CheckoutForm = ({ profile, whatsAppUrl, onBack, onDataChange }: Props) => {
  const [deliveryType, setDeliveryType] = useState<"delivery" | "retiro">("delivery");
  const [address, setAddress] = useState("");
  const [references, setReferences] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [customerName, setCustomerName] = useState(profile?.name || "");
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || "");

  useEffect(() => {
    if (profile?.name && !customerName) setCustomerName(profile.name);
    if (profile?.phone && !customerPhone) setCustomerPhone(profile.phone);
  }, [profile]);

  useEffect(() => {
    onDataChange({
      deliveryType,
      address: address.trim(),
      references: references.trim(),
      pickupTime: pickupTime.trim(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
    });
  }, [deliveryType, address, references, pickupTime, customerName, customerPhone, onDataChange]);

  const isValid =
    customerName.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    (deliveryType === "delivery"
      ? address.trim().length > 0
      : pickupTime.trim().length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-5 border-b">
        <button
          onClick={onBack}
          className="p-2 hover:bg-secondary rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="font-display font-bold text-xl">Datos de entrega</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Tipo de entrega */}
        <div className="space-y-3">
          <Label className="font-body font-semibold text-sm">📍 Tipo de entrega</Label>
          <RadioGroup
            value={deliveryType}
            onValueChange={(v) => setDeliveryType(v as "delivery" | "retiro")}
            className="flex gap-4"
          >
            <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${deliveryType === "delivery" ? "border-accent bg-accent/10" : "border-border"}`}>
              <RadioGroupItem value="delivery" />
              <span className="font-body text-sm">Delivery</span>
            </label>
            <label className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${deliveryType === "retiro" ? "border-accent bg-accent/10" : "border-border"}`}>
              <RadioGroupItem value="retiro" />
              <span className="font-body text-sm">Retiro en local</span>
            </label>
          </RadioGroup>
        </div>

        {/* Campos condicionales */}
        {deliveryType === "delivery" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="font-body text-sm font-semibold">
                Dirección completa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, barrio..."
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="references" className="font-body text-sm font-semibold">
                Referencias (opcional)
              </Label>
              <Input
                id="references"
                value={references}
                onChange={(e) => setReferences(e.target.value)}
                placeholder="Ej: casa con portón verde"
                maxLength={200}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="pickupTime" className="font-body text-sm font-semibold">
              Horario estimado de retiro <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pickupTime"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              placeholder="Ej: 10:00 hs"
              maxLength={50}
            />
          </div>
        )}

        {/* Datos del cliente */}
        <div className="space-y-4">
          <Label className="font-body font-semibold text-sm">👤 Datos del cliente</Label>
          <div className="space-y-2">
            <Label htmlFor="customerName" className="font-body text-sm">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Tu nombre"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerPhone" className="font-body text-sm">
              Teléfono <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Ej: 261 1234567"
              maxLength={20}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-5">
        <a
          href={isValid ? whatsAppUrl : undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { if (!isValid) e.preventDefault(); }}
          className={`flex items-center justify-center gap-2 w-full font-body font-bold py-4 rounded-full text-lg transition-all shadow-lg ${
            isValid
              ? "bg-whatsapp text-whatsapp-foreground hover:brightness-110 cursor-pointer"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          Enviar pedido por WhatsApp
        </a>
      </div>
    </div>
  );
};

export default CheckoutForm;
