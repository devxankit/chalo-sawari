import { Button } from "@/components/ui/button";
import { ChevronDown, Globe, HelpCircle, Phone, Bell, Settings, User, LogOut, Menu } from "lucide-react";
import busLogo from "@/assets/BusLogo.png";
import { Link, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminTopNavigationProps {
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: (isOpen: boolean) => void;
}

const AdminTopNavigation = ({ isMobileMenuOpen, onMobileMenuToggle }: AdminTopNavigationProps) => {
  const navigate = useNavigate();
  const { logout, adminData } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin-auth');
  };

  const getAdminInitials = () => {
    if (adminData?.firstName && adminData?.lastName) {
      return `${adminData.firstName.charAt(0)}${adminData.lastName.charAt(0)}`;
    }
    return 'AD';
  };

  const getAdminName = () => {
    if (adminData?.firstName && adminData?.lastName) {
      return `${adminData.firstName} ${adminData.lastName}`;
    }
    return 'Admin User';
  };

  return (
    <nav className="w-full bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        {/* Main navigation */}
        <div className="flex justify-between items-center py-1 md:py-1 py-3">
          <Link to="/admin" className="flex items-center ml-2 md:ml-4 hover:opacity-80 transition-opacity">
            <div className="flex items-center space-x-1 md:space-x-2">
              {/* Logo Icon */}
              <img src={busLogo} alt="Bus Logo" className="w-16 h-16 md:w-16 md:h-20 lg:w-20 lg:h-20 object-contain" />
              {/* Logo Text */}
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <span className="text-lg md:text-lg lg:text-2xl font-bold text-black">CHALO</span>
                  <span className="text-lg md:text-lg lg:text-2xl font-bold text-blue-600 ml-1">SAWARI</span>
                </div>
                <span className="text-xs text-gray-600 hidden sm:block">Admin Portal</span>
              </div>
            </div>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{getAdminInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:block">{getAdminName()}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => onMobileMenuToggle?.(!isMobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminTopNavigation; 