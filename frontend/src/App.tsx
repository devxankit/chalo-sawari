import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Bookings from "./pages/Bookings";
import Help from "./pages/Help";
import Profile from "./pages/Profile";
import VihicleSearch from "./pages/VihicleSearch";

import NotFound from "./pages/NotFound";
import DriverAuth from "./driver/pages/DriverAuth";
import DriverHome from "./driver/pages/DriverHome";
import DriverRequests from "./driver/pages/DriverRequests";
import DriverMyVehicle from "./driver/pages/DriverMyVehicle";
import DriverProfile from "./driver/pages/DriverProfile";
import AdminAuth from "./admin/pages/AdminAuth";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminUserManagement from "./admin/pages/AdminUserManagement";
import AdminDriverManagement from "./admin/pages/AdminDriverManagement";
import AdminPriceManagement from "./admin/pages/AdminPriceManagement";
import AdminVehicleManagement from "./admin/pages/AdminVehicleManagement";
import AdminSettings from "./admin/pages/AdminSettings";

import AdminPaymentManagement from "./admin/pages/AdminPaymentManagement";

import AdminBookingManagement from "./admin/pages/AdminBookingManagement";
import AdminProfile from "./admin/pages/AdminProfile";
import AdminOffersCoupons from "./admin/pages/AdminOffersCoupons";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedDriverRoute from "./components/ProtectedDriverRoute";
import ProtectedUserRoute from "./components/ProtectedUserRoute";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import { DriverAuthProvider } from "./contexts/DriverAuthContext";
import { UserAuthProvider } from "./contexts/UserAuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
              <AdminAuthProvider>
        <DriverAuthProvider>
        <UserAuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/bookings" element={<ProtectedUserRoute><Bookings /></ProtectedUserRoute>} />
              <Route path="/help" element={<Help />} />
              <Route path="/profile" element={<ProtectedUserRoute><Profile /></ProtectedUserRoute>} />
              <Route path="/vihicle-search" element={<VihicleSearch />} />

              {/* Driver Module Routes */}
              <Route path="/driver-auth" element={<DriverAuth />} />
              <Route path="/driver" element={<ProtectedDriverRoute><DriverHome /></ProtectedDriverRoute>} />
              <Route path="/driver/requests" element={<ProtectedDriverRoute><DriverRequests /></ProtectedDriverRoute>} />
              <Route path="/driver/myvehicle" element={<ProtectedDriverRoute><DriverMyVehicle /></ProtectedDriverRoute>} />
              <Route path="/driver/profile" element={<ProtectedDriverRoute><DriverProfile /></ProtectedDriverRoute>} />
              
              {/* Admin Module Routes */}
              <Route path="/admin-auth" element={<AdminAuth />} />
              <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
              <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUserManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/drivers" element={<ProtectedAdminRoute><AdminDriverManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/vehicles" element={<ProtectedAdminRoute><AdminVehicleManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/prices" element={<ProtectedAdminRoute><AdminPriceManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />

              <Route path="/admin/payments" element={<ProtectedAdminRoute><AdminPaymentManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/offers-coupons" element={<ProtectedAdminRoute><AdminOffersCoupons /></ProtectedAdminRoute>} />

              <Route path="/admin/bookings" element={<ProtectedAdminRoute><AdminBookingManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/bookings/active" element={<ProtectedAdminRoute><AdminBookingManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/bookings/completed" element={<ProtectedAdminRoute><AdminBookingManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/bookings/cancelled" element={<ProtectedAdminRoute><AdminBookingManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/bookings/analytics" element={<ProtectedAdminRoute><AdminBookingManagement /></ProtectedAdminRoute>} />
              <Route path="/admin/profile" element={<ProtectedAdminRoute><AdminProfile /></ProtectedAdminRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </UserAuthProvider>
        </DriverAuthProvider>
      </AdminAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
