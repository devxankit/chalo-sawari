import { Button } from "@/components/ui/button";
import { ChevronDown, Globe, HelpCircle, User, Phone, Home, List } from "lucide-react";
import busLogo from "@/assets/BusLogo.png";
import { Link, useLocation } from "react-router-dom";

const TopNavigation = () => {
  const location = useLocation();
  const isOnAuthPage = location.pathname === "/auth";

  return (
    <nav className="sticky top-0 z-50 w-full bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        {/* Top bar with contact info */}
        <div className="hidden md:flex justify-between items-center py-2 text-sm border-b">
          <div className="flex items-center space-x-4 text-muted-foreground">
            <span className="flex items-center transition-all duration-300 hover:text-primary hover:scale-105">
              <Phone className="w-4 h-4 mr-2 transition-all duration-300 hover:rotate-12" />
              Customer Care: +91 9171838260
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground transition-all duration-300 hover:scale-105 hover:bg-blue-50">
              <Globe className="w-4 h-4 mr-2 transition-all duration-300 hover:rotate-12" />
              English
              <ChevronDown className="w-4 h-4 ml-1 transition-all duration-300 hover:rotate-180" />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground transition-all duration-300 hover:scale-105 hover:bg-blue-50">
              <HelpCircle className="w-4 h-4 mr-2 transition-all duration-300 hover:rotate-12" />
              Help
            </Button>
          </div>
        </div>

        {/* Main navigation */}
        <div className="flex justify-between items-center  md:py-1 py-3">
          {/* Mobile Logo + Text */}
          <Link to="/" className="flex items-center ml-2 md:ml-4 hover:opacity-80 transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-1 md:space-x-2">
              {/* Logo Icon */}
              <img src={busLogo} alt="Bus Logo" className="w-16 h-16 object-contain md:w-14 md:h-14 lg:w-18 lg:h-18 transition-all duration-300 hover:rotate-12" />
              {/* Mobile: Show text next to logo, Desktop: as before */}
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-black md:text-lg lg:text-xl md:font-bold transition-all duration-300 hover:text-gray-700">CHALO</span>
                  <span className="text-xl font-bold text-blue-600 ml-1 md:text-lg lg:text-xl md:font-bold transition-all duration-300 hover:text-blue-700">SAWARI</span>
                </div>
                <span className="text-xs text-gray-600 hidden sm:block md:block transition-all duration-300 hover:text-gray-800">Travel with Confidence</span>
                <span className="text-xs text-black font-medium md:hidden transition-all duration-300 hover:text-gray-700">24/7 Support</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-md">
              <Home className="w-5 h-5 text-primary transition-all duration-300 hover:rotate-12" />
              <span className="font-medium transition-all duration-300 hover:text-primary">Home</span>
            </Link>
            <Link to="/bookings" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-md">
              <List className="w-5 h-5 text-muted-foreground transition-all duration-300 hover:text-primary hover:rotate-12" />
              <span className="font-medium text-muted-foreground transition-all duration-300 hover:text-primary">Bookings</span>
            </Link>
            <Link to="/help" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-md">
              <HelpCircle className="w-5 h-5 text-muted-foreground transition-all duration-300 hover:text-primary hover:rotate-12" />
              <span className="font-medium text-muted-foreground transition-all duration-300 hover:text-primary">Help</span>
            </Link>
            <Link to="/profile" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-all duration-300 hover:scale-105 hover:shadow-md">
              <User className="w-5 h-5 text-muted-foreground transition-all duration-300 hover:text-primary hover:rotate-12" />
              <span className="font-medium text-muted-foreground transition-all duration-300 hover:text-primary">Account</span>
            </Link>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg transform hover:-translate-y-1"
              onClick={() => window.open('https://play.google.com/store/apps/details?id=com.chalo.sawari', '_blank')}
            >
              Download App
            </Button>
          </div>

          {/* Medium Screen Navigation (Tablets) */}
          <div className="hidden md:flex lg:hidden items-center space-x-4">
            <Link to="/" className="flex items-center space-x-1 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-300 hover:scale-105">
              <Home className="w-4 h-4 text-primary transition-all duration-300 hover:rotate-12" />
              <span className="text-sm font-medium transition-all duration-300 hover:text-primary">Home</span>
            </Link>
            <Link to="/bookings" className="flex items-center space-x-1 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-300 hover:scale-105">
              <List className="w-4 h-4 text-muted-foreground transition-all duration-300 hover:text-primary hover:rotate-12" />
              <span className="text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-primary">Bookings</span>
            </Link>
            <Link to="/help" className="flex items-center space-x-1 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-300 hover:scale-105">
              <HelpCircle className="w-4 h-4 text-muted-foreground transition-all duration-300 hover:text-primary hover:rotate-12" />
              <span className="text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-primary">Help</span>
            </Link>
            <Link to="/profile" className="flex items-center space-x-1 px-2 py-2 rounded-md hover:bg-gray-100 transition-all duration-300 hover:scale-105">
              <User className="w-4 h-4 text-muted-foreground transition-all duration-300 hover:text-primary hover:rotate-12" />
              <span className="text-sm font-medium text-muted-foreground transition-all duration-300 hover:text-primary">Account</span>
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground mb-1 transition-all duration-300 hover:text-gray-800">Helpline Number</span>
              <button 
                onClick={() => window.location.href = "tel:+919171838260"}
                className="flex items-center text-xs text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105"
              >
                <Phone className="w-3 h-3 mr-1 transition-all duration-300 hover:rotate-12" />
                +91 9171838260
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;