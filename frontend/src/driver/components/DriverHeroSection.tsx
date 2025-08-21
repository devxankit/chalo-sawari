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
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";

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
  // Counting animations for hero section
  const activeVehiclesCount = useCountAnimation(2, 1200, 500);
  const todaysEarnings = useCountAnimation(2450, 1800, 700);
  const ratingCount = useDecimalCountAnimation(4.8, 1500, 900);
  const happyCustomersCount = useCountAnimation(156, 2000, 1100);

  return (
    <section className="relative min-h-[405px]mb-20 flex flex-col bg-gradient-to-br from-blue-50 to-green-50">
      
      {/* Desktop Hero Content */}
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

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-0 rounded-xl">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{activeVehiclesCount}</h3>
                <p className="text-sm text-gray-600">Active Vehicles</p>
              </div>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-0 rounded-xl">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">₹{todaysEarnings.toLocaleString()}</h3>
                <p className="text-sm text-gray-600">Today's Earnings</p>
              </div>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-0 rounded-xl">
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{ratingCount}</h3>
                <p className="text-sm text-gray-600">Rating</p>
              </div>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-0 rounded-xl">
              <div className="p-6 text-center">
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2 ml-2"> OWNER DRIVER <span className="text-blue-600">DASHBOARD</span></h1>
          <p className="text-gray-600 text-sm">
            Manage your rides and earnings
          </p>
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
                <p className="text-xs text-gray-600">Vehicles</p>
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