import { Link, useLocation } from "react-router-dom";
import { 
  Home,
  FileText,
  Car,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const DriverBottomNavigation = () => {
  const location = useLocation();

  const navigationItems = [
    {
      title: "Home",
      href: "/driver",
      icon: Home,
    },
    {
      title: "Requests",
      href: "/driver/requests",
      icon: FileText,
    },
    {
      title: "My Vehicle",
      href: "/driver/myvehicle",
      icon: Car,
    },
    {
      title: "Profile",
      href: "/driver/profile",
      icon: User,
    },
  ];

  const isActive = (href: string) => {
    const currentPath = location.pathname;
    
    // For exact matches
    if (currentPath === href) {
      return true;
    }
    
    // For sub-routes, only match if it's a direct sub-route
    if (href === "/driver") {
      // Home should only be active for /driver exactly
      return currentPath === "/driver";
    }
    
    if (href === "/driver/requests") {
      // Requests should be active for /driver/requests and its direct sub-routes
      return currentPath.startsWith("/driver/requests");
    }
    
    if (href === "/driver/myvehicle") {
      // My Vehicle should be active for /driver/myvehicle and its direct sub-routes
      return currentPath.startsWith("/driver/myvehicle");
    }
    
    if (href === "/driver/profile") {
      // Profile should be active for /driver/profile and its direct sub-routes
      return currentPath.startsWith("/driver/profile");
    }
    
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex justify-around">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-3 min-w-0 flex-1",
                "transition-colors duration-200",
                active
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 mb-1",
                active ? "text-blue-600" : "text-gray-500"
              )} />
              <span className={cn(
                "text-xs font-medium truncate",
                active ? "text-blue-600" : "text-gray-600"
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DriverBottomNavigation;
