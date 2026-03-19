import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      setSubmitting(false);
      toast.error("Email o contraseña incorrectos. Intentá de nuevo.");
      return;
    }
    // Fetch user role to redirect to correct dashboard
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const firstRole = roles?.[0]?.role;
      toast.success("¡Bienvenido!");
      if (firstRole === "admin") {
        navigate("/admin");
      } else if (firstRole === "revendedor") {
        navigate("/revendedor");
      } else if (firstRole === "delivery") {
        navigate("/delivery");
      } else {
        navigate("/");
      }
    } else {
      toast.success("¡Bienvenido!");
      navigate("/");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logo} alt="Panificadora Eliseo" className="h-16 mx-auto mb-4" />
          </Link>
          <h1 className="font-display text-2xl font-bold mb-2">Ingresá a tu cuenta</h1>
          <p className="text-muted-foreground font-body text-sm">
            Si ya tenés cuenta, ingresá con tu email y contraseña
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block font-body font-medium text-sm mb-1.5">Email</label>
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-base py-3"
            />
          </div>
          <div>
            <label className="block font-body font-medium text-sm mb-1.5">Contraseña</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base py-3 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent text-accent-foreground font-body font-bold py-3 rounded-full text-base hover:brightness-110 transition-all disabled:opacity-50"
          >
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="text-center mt-6 space-y-3">
          <p className="font-body text-sm text-muted-foreground">
            ¿No tenés cuenta?{" "}
            <Link to="/registro" className="text-accent font-semibold hover:underline">
              Registrate gratis
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

export default Login;
