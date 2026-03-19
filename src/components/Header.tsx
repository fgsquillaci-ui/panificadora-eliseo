import { ShoppingCart, User, LogOut, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import type { Profile } from "@/hooks/useAuth";
import type { AppRole } from "@/hooks/useRole";

interface Props {
  totalItems: number;
  bounceKey: number;
  onCartClick: () => void;
  profile: Profile | null;
  isLoggedIn: boolean;
  onSignOut: () => void;
  roles?: AppRole[];
}

const Header = ({ totalItems, bounceKey, onCartClick, profile, isLoggedIn, onSignOut, roles = [] }: Props) => {
  const panelPath = roles.includes("admin") ? "/admin" : roles.includes("revendedor") ? "/revendedor" : roles.includes("delivery") ? "/delivery" : null;

  return (
  <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b">
    <div className="container flex items-center justify-between h-16 px-5">
      <a href="#" className="flex items-center">
        <img src={logo} alt="Panificadora Eliseo" className="h-14" />
      </a>
      <nav className="hidden md:flex gap-6 font-body text-sm">
        <a href="#como-funciona" className="hover:text-accent transition-colors">Cómo funciona</a>
        <a href="#productos" className="hover:text-accent transition-colors">Productos</a>
        <a href="#quienes-somos" className="hover:text-accent transition-colors">Quiénes somos</a>
      </nav>
      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline font-body text-sm font-medium truncate max-w-[120px]">
              {profile?.name || "Mi cuenta"}
            </span>
            {profile && profile.discount_percent > 0 && (
              <span className="hidden sm:inline text-[10px] font-body font-semibold bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                -{profile.discount_percent}%
              </span>
            )}
            {panelPath && (
              <Link
                to={panelPath}
                className="p-2 hover:bg-secondary rounded-full transition-colors"
                title="Mi panel"
              >
                <LayoutDashboard className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={onSignOut}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-1.5 font-body text-sm font-medium px-3 py-1.5 rounded-full hover:bg-secondary transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Ingresar</span>
          </Link>
        )}
        <button onClick={onCartClick} className="relative p-2 hover:bg-secondary rounded-full transition-colors">
          <motion.div
            key={bounceKey}
            animate={bounceKey > 0 ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <ShoppingCart className="w-5 h-5" />
          </motion.div>
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </div>
  </header>
  );
};

export default Header;
