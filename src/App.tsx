import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Registro from "./pages/Registro.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import AdminDashboard from "./pages/admin/Dashboard.tsx";
import AdminOrders from "./pages/admin/Orders.tsx";
import AdminUsers from "./pages/admin/Users.tsx";
import AdminCustomers from "./pages/admin/Customers.tsx";
import RevendedorDashboard from "./pages/revendedor/Dashboard.tsx";
import RevendedorCustomers from "./pages/revendedor/Customers.tsx";
import DeliveryDashboard from "./pages/delivery/Dashboard.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/pedidos" element={<ProtectedRoute allowedRoles={["admin"]}><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/clientes" element={<ProtectedRoute allowedRoles={["admin"]}><AdminCustomers /></ProtectedRoute>} />

            {/* Revendedor routes */}
            <Route path="/revendedor" element={<ProtectedRoute allowedRoles={["revendedor"]}><RevendedorDashboard /></ProtectedRoute>} />
            <Route path="/revendedor/clientes" element={<ProtectedRoute allowedRoles={["revendedor"]}><RevendedorCustomers /></ProtectedRoute>} />

            {/* Delivery routes */}
            <Route path="/delivery" element={<ProtectedRoute allowedRoles={["delivery"]}><DeliveryDashboard /></ProtectedRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
