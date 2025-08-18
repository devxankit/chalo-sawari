import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCountAnimation } from "@/hooks/use-count-animation";
import adminApi from "@/services/adminApi";
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
  supportTickets: number;
}

interface RecentActivity {
  id: string;
  type: 'user' | 'driver' | 'booking' | 'payment' | 'support';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout: contextLogout } = useAdminAuth();
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = () => {
    // Use context to logout
    contextLogout();
    
    // Show success message
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of the admin panel.",
    });
    
    // Redirect to admin login
    navigate('/admin-auth');
  };
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeTrips: 0,
    pendingVerifications: 0,
    supportTickets: 0
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
  
  const animatedSupportTickets = useCountAnimation({ 
    end: stats.supportTickets, 
    delay: 1200, 
    duration: 1500,
    enabled: !isLoading 
  });

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "user",
      title: "New User Registration",
      description: "Ajay Panchal registered as a new user",
      time: "2 minutes ago",
      status: "success"
    },
    {
      id: "2",
      type: "driver",
      title: "Driver Verification Pending",
      description: "Rahul Kumar submitted verification documents",
      time: "15 minutes ago",
      status: "warning"
    },
    {
      id: "3",
      type: "booking",
      title: "Trip Completed",
      description: "Trip from Delhi to Mumbai completed successfully",
      time: "1 hour ago",
      status: "success"
    },
    {
      id: "4",
      type: "payment",
      title: "Payment Received",
      description: "₹2,500 received for booking #CS12345",
      time: "2 hours ago",
      status: "success"
    },
    {
      id: "5",
      type: "support",
      title: "Support Ticket Opened",
      description: "User reported issue with booking cancellation",
      time: "3 hours ago",
      status: "error"
    }
  ]);

  useEffect(() => {
    const initializeAdminModule = async () => {
      try {
        setIsLoading(true);
        
        // Since ProtectedAdminRoute handles authentication, we can assume admin is logged in
        // No need to set isLoggedIn state anymore
        
        // Fetch real dashboard data from API
        const dashboardData = await adminApi.getDashboardStats('month');
        
        if (dashboardData.success && dashboardData.data) {
          const { overview, growth, current } = dashboardData.data;
          
          setStats({
            totalUsers: overview.totalUsers || 0,
            totalDrivers: overview.totalDrivers || 0,
            totalVehicles: overview.totalVehicles || 0,
            totalBookings: overview.totalBookings || 0,
            totalRevenue: growth.revenue || 0,
            activeTrips: current.activeDrivers || 0,
            pendingVerifications: current.pendingBookings || 0,
            supportTickets: 0 // This might need a separate API call
          });
        }
        
      } catch (err) {
        console.error('Error initializing admin module:', err);
        toast({
          title: "Error",
          description: "Failed to load admin dashboard. Please try again.",
          variant: "destructive",
        });
        
        // Fallback to mock data if API fails
        setStats({
          totalUsers: 2547,
          totalDrivers: 156,
          totalVehicles: 89,
          totalBookings: 1247,
          totalRevenue: 4520000,
          activeTrips: 23,
          pendingVerifications: 8,
          supportTickets: 12
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeAdminModule();
  }, [navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="w-4 h-4" />;
      case 'driver': return <Car className="w-4 h-4" />;
      case 'booking': return <Calendar className="w-4 h-4" />;
      case 'payment': return <CreditCard className="w-4 h-4" />;
      case 'support': return <MessageSquare className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 animate-pulse">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Authentication is handled by ProtectedAdminRoute

  return (
    <AdminLayout>
      {/* Header with slide-in animation */}
      <div className="mb-6 md:mb-8 animate-slide-in-from-top">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 animate-fade-in-up">Admin Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600 animate-fade-in-up animation-delay-200">Welcome back! Here's what's happening with your business today.</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 transition-all duration-300"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Cards with staggered animations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card className="animate-fade-in-up animation-delay-100 hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg animate-bounce-slow">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 animate-count-up">
                  {animatedTotalUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animation-delay-200 hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg animate-bounce-slow animation-delay-100">
                <Car className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 animate-count-up">
                  {animatedTotalDrivers.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animation-delay-300 hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg animate-bounce-slow animation-delay-200">
                <Bus className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 animate-count-up">
                  {animatedTotalVehicles.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animation-delay-400 hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg animate-bounce-slow animation-delay-300">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              </div>
              <div className="ml-3 md:ml-4">
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 animate-count-up">
                  {animatedTotalBookings.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats with slide-in animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <Card className="animate-slide-in-from-left animation-delay-500 hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-lg md:text-xl font-bold text-gray-900 animate-count-up">
                  {formatCurrency(animatedTotalRevenue)}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg animate-pulse">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-in-from-left animation-delay-600 hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Active Trips</p>
                <p className="text-lg md:text-xl font-bold text-gray-900 animate-count-up">
                  {animatedActiveTrips.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg animate-pulse animation-delay-100">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-in-from-left animation-delay-700 hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Pending Verifications</p>
                <p className="text-lg md:text-xl font-bold text-gray-900 animate-count-up">
                  {animatedPendingVerifications.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg animate-pulse animation-delay-200">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-in-from-left animation-delay-800 hover:scale-105 transition-all duration-300 hover:shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">Support Tickets</p>
                <p className="text-lg md:text-xl font-bold text-gray-900 animate-count-up">
                  {animatedSupportTickets.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg animate-pulse animation-delay-300">
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities with staggered animations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className="animate-fade-in-up animation-delay-900 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl animate-fade-in-up">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div 
                  key={activity.id} 
                  className="flex items-start space-x-3 animate-fade-in-up hover:bg-gray-50 p-2 rounded-lg transition-all duration-200"
                  style={{ animationDelay: `${1000 + index * 100}ms` }}
                >
                  <div className={`p-2 rounded-lg ${getStatusColor(activity.status)} animate-bounce-slow`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up animation-delay-1000 hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl animate-fade-in-up">System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="animate-fade-in-up animation-delay-1100">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">System Health</span>
                  <span className="text-green-600 font-medium animate-pulse">Excellent</span>
                </div>
                <Progress value={95} className="h-2 animate-progress-fill" />
              </div>
              
              <div className="animate-fade-in-up animation-delay-1200">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Server Load</span>
                  <span className="text-blue-600 font-medium">Normal</span>
                </div>
                <Progress value={65} className="h-2 animate-progress-fill animation-delay-100" />
              </div>
              
              <div className="animate-fade-in-up animation-delay-1300">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Database</span>
                  <span className="text-green-600 font-medium animate-pulse animation-delay-200">Healthy</span>
                </div>
                <Progress value={88} className="h-2 animate-progress-fill animation-delay-200" />
              </div>
              
              <div className="animate-fade-in-up animation-delay-1400">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">API Response</span>
                  <span className="text-green-600 font-medium animate-pulse animation-delay-300">Fast</span>
                </div>
                <Progress value={92} className="h-2 animate-progress-fill animation-delay-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard; 