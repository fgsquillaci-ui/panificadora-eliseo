import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole, type AppRole } from "@/hooks/useRole";

interface Props {
  children: React.ReactNode;
  allowedRoles: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: roleLoading } = useRole(user?.id);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-body text-muted-foreground animate-pulse">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length === 0 || !allowedRoles.some((r) => roles.includes(r))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
