import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCountAnimation } from "@/hooks/use-count-animation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { 
  Users, 
  Car, 
  Bus, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  MessageSquare,
  BarChart3,
  Activity,
  DollarSign,
  UserCheck,
  UserX,
  Car as CarIcon,
  Bus as BusIcon,
  Truck,
  Bike,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus,
  Settings
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  totalVehicles: number;
  totalBookings: number;
  totalRevenue: number;
  activeTrips: number;
  pendingVerifications: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeTrips: 0,
    pendingVerifications: 0
  });

  // Counting animations for all stats
  const animatedTotalUsers = useCountAnimation({ 
    end: stats.totalUsers, 
    delay: 500, 
    duration: 1500,
    enabled: !isLoading 
  });
  
  const animatedTotalDrivers = useCountAnimation({ 
    end: stats.totalDrivers, 
    delay: 600, 
    duration: 1500,
    enabled: !isLoading 
  });
  
  const animatedTotalVehicles = useCountAnimation({ 
    end: stats.totalVehicles, 
    delay: 700, 
    duration: 1500,
    enabled: !isLoading 
  });
  
  const animatedTotalBookings = useCountAnimation({ 
    end: stats.totalBookings, 
    delay: 800, 
    duration: 1500,
    enabled: !isLoading 
  });
  
  const animatedTotalRevenue = useCountAnimation({ 
    end: stats.totalRevenue, 
    delay: 900, 
    duration: 2000,
    enabled: !isLoading 
  });
  
  const animatedActiveTrips = useCountAnimation({ 
    end: stats.activeTrips, 
    delay: 1000, 
    duration: 1500,
    enabled: !isLoading 
  });
  
  const animatedPendingVerifications = useCountAnimation({ 
    end: stats.pendingVerifications, 
    delay: 1100, 
    duration: 1500,
    enabled: !isLoading 
  });

  useEffect(() => {
    const initializeAdminModule = async () => {
      try {
        // Simulate loading dashboard data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set mock data
        setStats({
          totalUsers: 2547,
          totalDrivers: 156,
          totalVehicles: 89,
          totalBookings: 1247,
          totalRevenue: 4520000,
          activeTrips: 23,
          pendingVerifications: 8
        });
        
      } catch (err) {
        console.error('Error initializing admin module:', err);
        toast({
          title: "Error",
          description: "Failed to load admin dashboard. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (isAuthenticated) {
      initializeAdminModule();
    }
  }, [isAuthenticated]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/admin-auth');
    return null;
  }

  return (
    <AdminLayout>
      {/* Enhanced Header with better styling */}
      <div className="mb-8 md:mb-12 animate-slide-in-from-top">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 animate-fade-in-up">
            Admin Dashboard
          </h1>
          <p className="text-blue-100 text-lg animate-fade-in-up animation-delay-200">
            Welcome back! Here's what's happening with your business today.
          </p>
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-blue-100 text-sm">System Status: Online</span>
          </div>
        </div>
      </div>

      {/* Primary Stats Cards - Enhanced design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="animate-fade-in-up animation-delay-100 hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Total Users</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-900 animate-count-up">
                  {animatedTotalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-1">+12% from last month</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-xl text-white">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animation-delay-200 hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Total Drivers</p>
                <p className="text-2xl md:text-3xl font-bold text-green-900 animate-count-up">
                  {animatedTotalDrivers.toLocaleString()}
                </p>
                <p className="text-xs text-green-600 mt-1">+8% from last month</p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl text-white">
                <Car className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animation-delay-300 hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Total Vehicles</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-900 animate-count-up">
                  {animatedTotalVehicles.toLocaleString()}
                </p>
                <p className="text-xs text-purple-600 mt-1">+15% from last month</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-xl text-white">
                <Bus className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animation-delay-400 hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 mb-1">Total Bookings</p>
                <p className="text-2xl md:text-3xl font-bold text-orange-900 animate-count-up">
                  {animatedTotalBookings.toLocaleString()}
                </p>
                <p className="text-xs text-orange-600 mt-1">+20% from last month</p>
              </div>
              <div className="p-3 bg-orange-500 rounded-xl text-white">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Cards - Enhanced design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="animate-slide-in-from-left animation-delay-500 hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-1">Total Revenue</p>
                <p className="text-xl md:text-2xl font-bold text-emerald-900 animate-count-up">
                  {formatCurrency(animatedTotalRevenue)}
                </p>
                <p className="text-xs text-emerald-600 mt-1">+18% from last month</p>
              </div>
              <div className="p-3 bg-emerald-500 rounded-xl text-white">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-in-from-left animation-delay-600 hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br from-cyan-50 to-cyan-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700 mb-1">Active Trips</p>
                <p className="text-xl md:text-2xl font-bold text-cyan-900 animate-count-up">
                  {animatedActiveTrips.toLocaleString()}
                </p>
                <p className="text-xs text-cyan-600 mt-1">Currently running</p>
              </div>
              <div className="p-3 bg-cyan-500 rounded-xl text-white">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-in-from-left animation-delay-700 hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">Pending Verifications</p>
                <p className="text-xl md:text-2xl font-bold text-amber-900 animate-count-up">
                  {animatedPendingVerifications.toLocaleString()}
                </p>
                <p className="text-xs text-amber-600 mt-1">Requires attention</p>
              </div>
              <div className="p-3 bg-amber-500 rounded-xl text-white">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>


      </div>


    </AdminLayout>
  );
};

export default AdminDashboard; 