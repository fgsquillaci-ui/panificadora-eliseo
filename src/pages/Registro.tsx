import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Registro = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, name, phone);
    setSubmitting(false);
    if (error) {
      toast.error("No se pudo crear la cuenta. Intentá con otro email.");
    } else {
      toast.success("¡Cuenta creada! Ya podés hacer pedidos con descuentos.");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logo} alt="Panificadora Eliseo" className="h-16 mx-auto mb-4" />
          </Link>
          <h1 className="font-display text-2xl font-bold mb-2">Creá tu cuenta</h1>
          <p className="text-muted-foreground font-body text-sm">
            Registrate para acceder a descuentos especiales.<br />
            <span className="text-xs">No es obligatorio para hacer pedidos.</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block font-body font-medium text-sm mb-1.5">Nombre completo *</label>
            <Input
              type="text"
              placeholder="Ej: Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="text-base py-3"
            />
          </div>
          <div>
            <label className="block font-body font-medium text-sm mb-1.5">Teléfono (opcional)</label>
            <Input
              type="tel"
              placeholder="Ej: 261 456 7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              className="text-base py-3"
            />
          </div>
          <div>
            <label className="block font-body font-medium text-sm mb-1.5">Email *</label>
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              className="text-base py-3"
            />
          </div>
          <div>
            <label className="block font-body font-medium text-sm mb-1.5">Contraseña *</label>
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="text-base py-3"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent text-accent-foreground font-body font-bold py-3 rounded-full text-base hover:brightness-110 transition-all disabled:opacity-50"
          >
            {submitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <div className="text-center mt-6 space-y-3">
          <p className="font-body text-sm text-muted-foreground">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="text-accent font-semibold hover:underline">
              Ingresá acá
            </Link>
          </p>
          <Link to="/" className="inline-block font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Registro;
