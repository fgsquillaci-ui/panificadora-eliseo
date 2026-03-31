import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole, type AppRole } from "@/hooks/useRole";
import { LogOut, LayoutDashboard, Package, Users, Truck, Home, UserRound, DollarSign, Wheat, BookOpen, Receipt } from "lucide-react";
import logo from "@/assets/logo.png";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: AppRole[];
}

const allNavItems: NavItem[] = [
  { label: "Dashboard", path: "/admin", icon: <LayoutDashboard className="w-4 h-4" />, roles: ["admin"] },
  { label: "Pedidos", path: "/admin/pedidos", icon: <Package className="w-4 h-4" />, roles: ["admin"] },
  { label: "Personal", path: "/admin/usuarios", icon: <Users className="w-4 h-4" />, roles: ["admin"] },
  { label: "Clientes", path: "/admin/clientes", icon: <UserRound className="w-4 h-4" />, roles: ["admin"] },
  { label: "Finanzas", path: "/admin/finanzas", icon: <DollarSign className="w-4 h-4" />, roles: ["admin"] },
  { label: "Materia Prima", path: "/admin/ingredientes", icon: <Wheat className="w-4 h-4" />, roles: ["admin"] },
  { label: "Recetas", path: "/admin/recetas", icon: <BookOpen className="w-4 h-4" />, roles: ["admin"] },
  { label: "Mis Pedidos", path: "/revendedor", icon: <Package className="w-4 h-4" />, roles: ["revendedor"] },
  { label: "Mis Clientes", path: "/revendedor/clientes", icon: <UserRound className="w-4 h-4" />, roles: ["revendedor"] },
  { label: "Entregas", path: "/delivery", icon: <Truck className="w-4 h-4" />, roles: ["delivery"] },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, signOut } = useAuth();
  const { roles } = useRole(user?.id);
  const location = useLocation();

  const navItems = allNavItems.filter((item) =>
    item.roles.some((r) => roles.includes(r))
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r bg-card p-4 gap-2">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <img src={logo} alt="Panificadora Eliseo" className="h-10" />
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-body text-sm transition-colors ${
                location.pathname === item.path
                  ? "bg-accent/15 text-accent font-semibold"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t pt-3 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-body text-sm text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Home className="w-4 h-4" />
            Ir a la tienda
          </Link>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-body text-sm text-muted-foreground hover:bg-secondary transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between border-b p-4 bg-card">
          <Link to="/">
            <img src={logo} alt="Panificadora Eliseo" className="h-8" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-body text-xs text-muted-foreground truncate max-w-[100px]">
              {profile?.name}
            </span>
            <button onClick={signOut} className="p-2 hover:bg-secondary rounded-full">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex border-b bg-card overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 px-4 py-3 font-body text-xs whitespace-nowrap border-b-2 transition-colors ${
                location.pathname === item.path
                  ? "border-accent text-accent font-semibold"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
