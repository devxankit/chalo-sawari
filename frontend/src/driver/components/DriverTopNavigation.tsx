import { Button } from "@/components/ui/button";
import { ChevronDown, Globe, HelpCircle, Phone } from "lucide-react";
import busLogo from "@/assets/BusLogo.png";
import { Link } from "react-router-dom";

const DriverTopNavigation = () => {
  return (
    <nav className="w-full bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        {/* Top bar with contact info */}
        <div className="hidden md:flex justify-between items-center py-2 text-sm border-b">
          <div className="flex items-center space-x-4 text-muted-foreground">
            <span className="flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              Support: +91 9171838260
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Globe className="w-4 h-4 mr-2" />
              English
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </Button>
          </div>
        </div>

        {/* Main navigation - Logo only */}
        <div className="flex justify-between items-center py-1 md:py-1 py-3">
          <Link to="/driver" className="flex items-center ml-2 md:ml-4 hover:opacity-80 transition-opacity">
            <div className="flex items-center space-x-1 md:space-x-2">
              {/* Logo Icon */}
              <img src={busLogo} alt="Bus Logo" className="w-12 h-12 md:w-14 md:h-14 lg:w-18 lg:h-18 object-contain" />
              {/* Logo Text */}
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <span className="text-lg md:text-lg lg:text-xl font-bold text-black">CHALO</span>
                  <span className="text-lg md:text-lg lg:text-xl font-bold text-blue-600 ml-1">SAWARI</span>
                </div>
                <span className="text-xs text-gray-600 hidden sm:block">Owner Driver Portal</span>
              </div>
            </div>
          </Link>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => window.open('https://play.google.com/store/apps/details?id=com.chalo.ownerdriver', '_blank')}
            >
              Download Driver App
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DriverTopNavigation; 