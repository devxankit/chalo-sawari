import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/admin/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCountAnimation } from "@/hooks/use-count-animation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { adminDashboard } from "@/services/adminApi";
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
  UserX,
  Car as CarIcon,
  Bus as BusIcon,
  Truck,
  Bike,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Plus,
  Settings,
  RefreshCw,
  Loader2,
  ChevronDown,
  CalendarDays,
  CalendarRange
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  totalVehicles: number;
  totalBookings: number;
  totalRevenue: number;
  periodRevenue: number;
  activeTrips: number;
  pendingVerifications: number;
  newUsers: number;
  newDrivers: number;
  newBookings: number;
  pendingBookings: number;
  availableVehicles: number;
  recentActivity: {
    newUsersToday: number;
    newDriversToday: number;
    newBookingsToday: number;
  };
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
    periodRevenue: 0,
    activeTrips: 0,
    pendingVerifications: 0,
    newUsers: 0,
    newDrivers: 0,
    newBookings: 0,
    pendingBookings: 0,
    availableVehicles: 0,
    recentActivity: {
      newUsersToday: 0,
      newDriversToday: 0,
      newBookingsToday: 0,
    }
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Counting animations for all stats
  const animatedTotalUsers = useCountAnimation({ 
    end: stats.totalUsers, 
    delay: 500, 
    duration: 1500,
    enabled: !isLoading && !isLoadingStats
  });
  
  const animatedTotalDrivers = useCountAnimation({ 
    end: stats.totalDrivers, 
    delay: 600, 
    duration: 1500,
    enabled: !isLoading && !isLoadingStats
  });
  
  const animatedTotalVehicles = useCountAnimation({ 
    end: stats.totalVehicles, 
    delay: 700, 
    duration: 1500,
    enabled: !isLoading && !isLoadingStats
  });
  
  const animatedTotalBookings = useCountAnimation({ 
    end: stats.totalBookings, 
    delay: 800, 
    duration: 1500,
    enabled: !isLoading && !isLoadingStats
  });
  
  const animatedTotalRevenue = useCountAnimation({ 
    end: stats.totalRevenue, 
    delay: 900, 
    duration: 2000,
    enabled: !isLoading && !isLoadingStats
  });
  
  const animatedActiveTrips = useCountAnimation({ 
    end: stats.activeTrips, 
    delay: 1000, 
    duration: 1500,
    enabled: !isLoading && !isLoadingStats
  });
  
  const animatedPendingVerifications = useCountAnimation({ 
    end: stats.pendingVerifications, 
    delay: 1100, 
    duration: 1500,
    enabled: !isLoading && !isLoadingStats
  });

  const fetchDashboardStats = async (period: 'week' | 'month' | 'year' = 'month') => {
    try {
      setIsLoadingStats(true);
      const response = await adminDashboard.getStats(period);
      
      if (response.success) {
        const data = response.data;
        setStats({
          totalUsers: data.overview.totalUsers || 0,
          totalDrivers: data.overview.totalDrivers || 0,
          totalVehicles: data.overview.totalVehicles || 0,
          totalBookings: data.overview.totalBookings || 0,
          totalRevenue: data.revenue?.totalRevenue || 0,
          periodRevenue: data.revenue?.periodRevenue || 0,
          activeTrips: data.current.activeTrips || 0,
          pendingVerifications: data.current.pendingVerifications || 0,
          newUsers: data.growth.newUsers || 0,
          newDrivers: data.growth.newDrivers || 0,
          newBookings: data.growth.newBookings || 0,
          pendingBookings: data.current.pendingBookings || 0,
          availableVehicles: data.current.availableVehicles || 0,
          recentActivity: {
            newUsersToday: data.recent?.newUsersToday || 0,
            newDriversToday: data.recent?.newDriversToday || 0,
            newBookingsToday: data.recent?.newBookingsToday || 0,
          }
        });
      } else {
        throw new Error(response.message || 'Failed to fetch dashboard stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardStats(selectedPeriod);
    }
  }, [isAuthenticated, selectedPeriod]);

  const handleRefresh = () => {
    fetchDashboardStats(selectedPeriod);
    toast({
      title: "Refreshed",
      description: "Dashboard data has been refreshed",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGrowthPercentage = (current: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
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
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30 focus:bg-white/30 focus:ring-2 focus:ring-white/50 transition-all duration-200 min-w-[140px] justify-between"
                  >
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="font-medium">
                        {selectedPeriod === 'week' && 'This Week'}
                        {selectedPeriod === 'month' && 'This Month'}
                        {selectedPeriod === 'year' && 'This Year'}
                      </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border-0 shadow-xl rounded-xl p-2">
                  <DropdownMenuItem 
                    onClick={() => setSelectedPeriod('week')}
                    className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedPeriod === 'week' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <CalendarDays className={`w-4 h-4 mr-3 ${
                      selectedPeriod === 'week' ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <div className="flex flex-col">
                      <span className="font-medium">This Week</span>
                      <span className="text-xs text-gray-500">Last 7 days</span>
                    </div>
                    {selectedPeriod === 'week' && (
                      <CheckCircle className="w-4 h-4 ml-auto text-blue-600" />
                    )}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => setSelectedPeriod('month')}
                    className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedPeriod === 'month' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <CalendarRange className={`w-4 h-4 mr-3 ${
                      selectedPeriod === 'month' ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <div className="flex flex-col">
                      <span className="font-medium">This Month</span>
                      <span className="text-xs text-gray-500">Current month</span>
                    </div>
                    {selectedPeriod === 'month' && (
                      <CheckCircle className="w-4 h-4 ml-auto text-blue-600" />
                    )}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => setSelectedPeriod('year')}
                    className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedPeriod === 'year' 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Calendar className={`w-4 h-4 mr-3 ${
                      selectedPeriod === 'year' ? 'text-blue-600' : 'text-gray-500'
                    }`} />
                    <div className="flex flex-col">
                      <span className="font-medium">This Year</span>
                      <span className="text-xs text-gray-500">Current year</span>
                    </div>
                    {selectedPeriod === 'year' && (
                      <CheckCircle className="w-4 h-4 ml-auto text-blue-600" />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Visual Separator */}
              <div className="hidden sm:block w-px bg-white/20 mx-2" />
              
              <Button
                onClick={handleRefresh}
                disabled={isLoadingStats}
                variant="outline"
                size="sm"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 focus:bg-white/30 focus:ring-2 focus:ring-white/50 transition-all duration-200"
              >
                {isLoadingStats ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
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
                <p className="text-xs text-blue-600 mt-1">
                  +{getGrowthPercentage(stats.newUsers, stats.totalUsers)}% from {selectedPeriod}
                </p>
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
                <p className="text-xs text-green-600 mt-1">
                  +{getGrowthPercentage(stats.newDrivers, stats.totalDrivers)}% from {selectedPeriod}
                </p>
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
                <p className="text-xs text-purple-600 mt-1">
                  {stats.availableVehicles} currently available
                </p>
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
                <p className="text-xs text-orange-600 mt-1">
                  +{getGrowthPercentage(stats.newBookings, stats.totalBookings)}% from {selectedPeriod}
                </p>
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
                <p className="text-xs text-emerald-600 mt-1">
                  All time completed bookings
                </p>
              </div>
              <div className="p-3 bg-emerald-500 rounded-xl text-white">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-in-from-left animation-delay-600 hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-700 mb-1">{selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Revenue</p>
                <p className="text-xl md:text-2xl font-bold text-indigo-900 animate-count-up">
                  {formatCurrency(stats.periodRevenue)}
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  From {selectedPeriod} bookings
                </p>
              </div>
              <div className="p-3 bg-indigo-500 rounded-xl text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>



        <Card className="animate-slide-in-from-left animation-delay-800 hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br from-cyan-50 to-cyan-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700 mb-1">Pending Verifications</p>
                <p className="text-xl md:text-2xl font-bold text-cyan-900 animate-count-up">
                  {animatedPendingVerifications.toLocaleString()}
                </p>
                <p className="text-xs text-cyan-600 mt-1">Drivers need verification</p>
              </div>
              <div className="p-3 bg-cyan-500 rounded-xl text-white">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-in-from-left animation-delay-900 hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br from-rose-50 to-rose-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-700 mb-1">Available Vehicles</p>
                <p className="text-xl md:text-2xl font-bold text-rose-900 animate-count-up">
                  {stats.availableVehicles.toLocaleString()}
                </p>
                <p className="text-xs text-rose-600 mt-1">Ready for booking</p>
              </div>
              <div className="p-3 bg-rose-500 rounded-xl text-white">
                <CarIcon className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-in-from-left animation-delay-1000 hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 bg-gradient-to-br from-violet-50 to-violet-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-700 mb-1">Pending Bookings</p>
                <p className="text-xl md:text-2xl font-bold text-violet-900 animate-count-up">
                  {stats.pendingBookings.toLocaleString()}
                </p>
                <p className="text-xs text-violet-600 mt-1">Awaiting confirmation</p>
              </div>
              <div className="p-3 bg-violet-500 rounded-xl text-white">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoadingStats && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Updating dashboard data...</p>
        </div>
      )}

      {/* Recent Activity Section */}
      <Card className="mt-8 animate-fade-in-up animation-delay-1200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activity (Last 24 Hours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900">{stats.recentActivity.newUsersToday}</h3>
              <p className="text-sm text-blue-600">New Users</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Car className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-green-900">{stats.recentActivity.newDriversToday}</h3>
              <p className="text-sm text-green-600">New Drivers</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-orange-900">{stats.recentActivity.newBookingsToday}</h3>
              <p className="text-sm text-orange-600">New Bookings</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </AdminLayout>
  );
};

export default AdminDashboard; 