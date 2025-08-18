import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DriverTopNavigation from "@/driver/components/DriverTopNavigation";
import DriverFooter from "@/driver/components/DriverFooter";
import DriverHeroSection from "@/driver/components/DriverHeroSection";
import { Home, MessageSquare, Car, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const DriverHome = () => {
  const navigate = useNavigate();
  const { driver, isLoggedIn, logout } = useDriverAuth();
  const [activeTab, setActiveTab] = useState("home");
  const [isLoaded, setIsLoaded] = useState(false);

  // Counting animations
  const activeRequestsCount = useCountAnimation(5, 1500, 1200);
  const totalVehiclesCount = useCountAnimation(3, 1200, 1400);
  const completedRidesCount = useCountAnimation(127, 2000, 1600);
  const totalEarnings = useCountAnimation(15420, 2500, 1800);

  useEffect(() => {
    if (isLoggedIn) {
      // Add a small delay for animation effect
      setTimeout(() => setIsLoaded(true), 100);
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    logout();
    navigate('/driver-auth');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case "requests":
        navigate('/driver/requests');
        break;
      case "myvehicle":
        navigate('/driver/myvehicle');
        break;
      case "profile":
        navigate('/driver/profile');
        break;
      default:
        navigate('/driver');
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DriverTopNavigation />
      {/* Driver Header with Animation */}
      <div className={`bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 shadow-lg transform transition-all duration-1000 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-[-20px] opacity-0'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 bg-white/20 rounded-full flex items-center justify-center transform transition-all duration-700 delay-300 ${
                isLoaded ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
              }`}>
                <Car className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div className={`transform transition-all duration-700 delay-500 ${
                isLoaded ? 'translate-x-0 opacity-100' : 'translate-x-[-20px] opacity-0'
              }`}>
                <h1 className="text-2xl font-bold animate-pulse">Owner Driver Module</h1>
                <p className="text-blue-100 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-ping"></span>
                  Welcome back, Owner Driver!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content with Staggered Animations */}
      <div className="container mx-auto px-4 py-6">
        {activeTab === "home" && (
          <div className={`space-y-6 transform transition-all duration-1000 delay-700 ${
            isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-[20px] opacity-0'
          }`}>
            {/* Driver Hero Section */}
            <div className={`transform transition-all duration-700 delay-800 ${
              isLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            }`}>
              <DriverHeroSection />
            </div>
            {/* Quick Action Cards with Staggered Animation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active Requests Card */}
              <Card className={`hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 transform ${
                isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-[30px] opacity-0'
              }`} style={{ transitionDelay: '900ms' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-blue-600 animate-pulse" />
                    <span>Active Requests</span>
                    <Badge variant="secondary" className="ml-auto bg-blue-600 text-white animate-bounce">
                      <span className="font-bold text-lg">{activeRequestsCount}</span>
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">You have {activeRequestsCount} pending ride requests</p>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 hover:shadow-lg"
                    onClick={() => handleTabChange("requests")}
                  >
                    View Requests
                  </Button>
                </CardContent>
              </Card>
              {/* My Vehicles Card */}
              <Card className={`hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 border-green-200 transform ${
                isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-[30px] opacity-0'
              }`} style={{ transitionDelay: '1100ms' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <Car className="w-5 h-5 text-green-600 animate-pulse" />
                    <span>My Vehicles</span>
                    <Badge variant="secondary" className="ml-auto bg-green-600 text-white">
                      <span className="font-bold text-lg">{totalVehiclesCount}</span>
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">Manage your {totalVehiclesCount} registered vehicles</p>
                  <Button 
                    variant="outline"
                    className="w-full border-green-600 text-green-600 hover:bg-green-50 transform hover:scale-105 transition-all duration-200 hover:shadow-lg"
                    onClick={() => handleTabChange("myvehicle")}
                  >
                    View Vehicles
                  </Button>
                </CardContent>
              </Card>
              {/* Profile Card */}
              <Card className={`hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 transform ${
                isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-[30px] opacity-0'
              }`} style={{ transitionDelay: '1300ms' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-purple-600 animate-pulse" />
                    <span>Driver Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">View your profile and earnings</p>
                    <div className="bg-purple-100 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-700">{completedRidesCount}</div>
                      <div className="text-xs text-purple-600">Completed Rides</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    className="w-full border-purple-600 text-purple-600 hover:bg-purple-50 transform hover:scale-105 transition-all duration-200 hover:shadow-lg mt-3"
                    onClick={() => handleTabChange("profile")}
                  >
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
            {/* Stats Section with Counting Animation */}
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mt-8 transform transition-all duration-1000 delay-1500 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-[20px] opacity-0'
            }`}>
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center p-4">
                <div className="text-3xl font-bold mb-1">{activeRequestsCount}</div>
                <div className="text-sm opacity-90">Active Requests</div>
              </Card>
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white text-center p-4">
                <div className="text-3xl font-bold mb-1">{totalVehiclesCount}</div>
                <div className="text-sm opacity-90">Total Vehicles</div>
              </Card>
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-center p-4">
                <div className="text-3xl font-bold mb-1">{completedRidesCount}</div>
                <div className="text-sm opacity-90">Completed Rides</div>
              </Card>
              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center p-4">
                <div className="text-3xl font-bold mb-1">₹{totalEarnings}</div>
                <div className="text-sm opacity-90">Total Earnings</div>
              </Card>
            </div>
          </div>
        )}
      </div>
      {/* Driver Footer */}
      <div className={`transform transition-all duration-700 delay-1500 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-[20px] opacity-0'
      }`}>
        <DriverFooter />
      </div>
      {/* Bottom Navigation with Slide-up Animation */}
      <div className={`fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 backdrop-blur-md z-50 shadow-lg transform transition-all duration-700 delay-1700 ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-[50px] opacity-0'
      }`}>
        <div className="flex justify-around py-3">
          <button 
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
              activeTab === "home" 
                ? "text-blue-600 bg-blue-50 scale-105" 
                : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => handleTabChange("home")}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button 
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
              activeTab === "requests" 
                ? "text-blue-600 bg-blue-50 scale-105" 
                : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => handleTabChange("requests")}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium">Requests</span>
          </button>
          <button 
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
              activeTab === "myvehicle" 
                ? "text-blue-600 bg-blue-50 scale-105" 
                : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => handleTabChange("myvehicle")}
          >
            <Car className="w-5 h-5" />
            <span className="text-xs font-medium">MyVehicle</span>
          </button>
          <button 
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-300 transform hover:scale-110 ${
              activeTab === "profile" 
                ? "text-blue-600 bg-blue-50 scale-105" 
                : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => handleTabChange("profile")}
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverHome; 