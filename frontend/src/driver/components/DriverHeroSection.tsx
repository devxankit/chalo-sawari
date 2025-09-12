import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Car, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Star, 
  Users, 
  Calendar,
  Navigation,
  Zap,
  Shield,
  Loader2,
  Download
} from "lucide-react";
import { useState, useEffect } from "react";
import driverApiService from "@/services/driverApi";
import { useDriverAuth } from "@/contexts/DriverAuthContext";

// Custom hook for counting animation
const useCountAnimation = (end: number, duration: number = 2000, delay: number = 0) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = Date.now();
      const startValue = 0;

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(startValue + (end - startValue) * easeOutQuart);
        
        setCount(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }, delay);

    return () => clearTimeout(timer);
  }, [end, duration, delay]);

  return count;
};

// Custom hook for decimal counting animation (for ratings)
const useDecimalCountAnimation = (end: number, duration: number = 2000, delay: number = 0) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = Date.now();
      const startValue = 0;

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (end - startValue) * easeOutQuart;
        
        setCount(Number(currentValue.toFixed(1)));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }, delay);

    return () => clearTimeout(timer);
  }, [end, duration, delay]);

  return count;
};

const DriverHeroSection = () => {
  const { driver } = useDriverAuth();
  const [dashboardData, setDashboardData] = useState({
    activeVehicles: 0,
    todayEarnings: 0,
    averageRating: 0,
    happyCustomers: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data on component mount
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const fetchDashboardData = async () => {
      try {
        if (!isMounted) return;
        
        setIsLoading(true);
        setError(null);
        
        const summary = await driverApiService.getDashboardSummary();
        
        if (!isMounted) return;
        
        // Use fallback values if data is missing
        const fallbackData = {
          activeVehicles: summary.activeVehicles || 0, // Use actual data or 0
          todayEarnings: summary.todayEarnings || 0,
          averageRating: summary.averageRating || 0, // Use actual data or 0
          happyCustomers: summary.happyCustomers || 0 // Use actual data or 0
        };
        
        setDashboardData(fallbackData);
        
      } catch (err) {
        if (!isMounted) return;
        
        console.error('DriverHeroSection: Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        // Set meaningful fallback values
        setDashboardData({
          activeVehicles: 0, // Start with 0 vehicles
          todayEarnings: 0,
          averageRating: 0, // Start with 0 rating
          happyCustomers: 0 // Start with 0 customers
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (driver) {
      // Add a small delay to prevent rapid API calls
      timeoutId = setTimeout(fetchDashboardData, 500);
    } else {
      // Set fallback data even when no driver is found
      setDashboardData({
        activeVehicles: 0,
        todayEarnings: 0,
        averageRating: 0,
        happyCustomers: 0
      });
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [driver]);

  // Counting animations for hero section with real data
  const activeVehiclesCount = useCountAnimation(dashboardData.activeVehicles, 1200, 500);
  const todaysEarnings = useCountAnimation(dashboardData.todayEarnings, 1800, 700);
  const ratingCount = useDecimalCountAnimation(dashboardData.averageRating, 1500, 900);
  const happyCustomersCount = useCountAnimation(dashboardData.happyCustomers, 2000, 1100);

  if (isLoading) {
    return (
      <section className="relative min-h-[405px] mb-20 flex flex-col bg-gradient-to-br from-blue-50 to-green-50">
        <div className="hidden md:block relative min-h-[405px] rounded-2xl flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10"></div>
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
                OWNER DRIVER <span className="text-blue-600">DASHBOARD</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Manage your rides, track earnings, and grow your business with our comprehensive driver platform
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-white/90 backdrop-blur-sm border-0 rounded-xl">
                  <div className="p-4 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative min-h-[405px] mb-20 flex flex-col bg-gradient-to-br from-blue-50 to-green-50">
        <div className="hidden md:block relative min-h-[405px] rounded-2xl flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10"></div>
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
                OWNER DRIVER <span className="text-blue-600">DASHBOARD</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Manage your rides, track earnings, and grow your business with our comprehensive driver platform
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-600 text-sm">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 bg-red-600 hover:bg-red-700"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[280px] mb-12 flex flex-col bg-gradient-to-br from-blue-50 to-green-50 mt-2">
      
      {/* Desktop Hero Content */}
      <div className="hidden md:block relative min-h-[280px] rounded-2xl flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10"></div>
        
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              OWNER DRIVER <span className="text-blue-600">DASHBOARD</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
              Manage your rides, track earnings, and grow your business with our comprehensive driver platform
            </p>
            {/* Download App Button */}
            <div className="flex justify-center">
              <Button
                asChild
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <a
                  href="https://play.google.com/store/apps/details?id=com.chalo.ownerdriver"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span className="font-semibold">Download Driver App</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-0 rounded-xl">
              <div className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{activeVehiclesCount}</h3>
                <p className="text-sm text-gray-600">Total Vehicles</p>
              </div>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-0 rounded-xl">
              <div className="p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">₹{todaysEarnings.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Today's Earnings</p>
              </div>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-0 rounded-xl">
              <div className="p-4 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{ratingCount}</h3>
                <p className="text-sm text-gray-600">Rating</p>
              </div>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-0 rounded-xl">
              <div className="p-4 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{happyCustomersCount}</h3>
                <p className="text-sm text-gray-600">Happy Customers</p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block md:hidden flex-1 flex flex-col -mt-8">
        {/* Mobile Header */}
        <div className="p-4 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 ml-2">
            OWNER DRIVER <span className="text-blue-600">DASHBOARD</span>
          </h1>
          <p className="text-gray-600 text-sm mb-4">
            Manage your rides and earnings
          </p>
          {/* Download App Button - Mobile */}
          <div className="flex justify-center">
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <a
                href="https://play.google.com/store/apps/details?id=com.chalo.ownerdriver"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span className="font-semibold text-sm">Download Driver App</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Mobile Quick Stats */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-white shadow-sm border-0 rounded-lg">
              <div className="p-4 text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Car className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{activeVehiclesCount}</h3>
                <p className="text-xs text-gray-600">Total Vehicles</p>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border-0 rounded-lg">
              <div className="p-4 text-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">₹{todaysEarnings.toLocaleString()}</h3>
                <p className="text-xs text-gray-600">Today</p>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border-0 rounded-lg">
              <div className="p-4 text-center">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Star className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{ratingCount}</h3>
                <p className="text-xs text-gray-600">Rating</p>
              </div>
            </Card>

            <Card className="bg-white shadow-sm border-0 rounded-lg">
              <div className="p-4 text-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{happyCustomersCount}</h3>
                <p className="text-xs text-gray-600">Customers</p>
              </div>
            </Card>
          </div>
        </div>


      </div>
    </section>
  );
};

export default DriverHeroSection; 