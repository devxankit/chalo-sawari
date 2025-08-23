import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  Bus, 
  FileText, 
  BarChart3, 
  Shield, 
  MessageSquare,
  Calendar,
  CreditCard,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  UserCheck,
  UserX,
  Car as CarIcon,
  Bus as BusIcon,
  Truck,
  Bike,
  X,
  Menu,
  Gift
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onMobileOpenChange?: (isOpen: boolean) => void;
}

const AdminSidebar = ({ isMobileOpen = false, onMobileOpenChange }: AdminSidebarProps) => {
  const location = useLocation();

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "User Management",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Driver Management",
      href: "/admin/drivers",
      icon: Car,
    },
    {
      title: "Vehicle Management",
      href: "/admin/vehicles",
      icon: Bus,
    },
    {
      title: "Price Management",
      href: "/admin/prices",
      icon: BarChart3,
    },
    {
      title: "Booking Management",
      href: "/admin/bookings",
      icon: Calendar,
    },
    {
      title: "Payment Management",
      href: "/admin/payments",
      icon: CreditCard,
    },
    {
      title: "Offers",
      href: "/admin/offers",
      icon: Gift,
    },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const renderSidebarItem = (item: SidebarItem) => {
    const isItemActive = isActive(item.href);

    return (
      <Link key={item.href} to={item.href} onClick={() => onMobileOpenChange?.(false)}>
        <Button
          variant={isItemActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start h-12 px-4",
            isItemActive 
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
              : "hover:bg-gray-100"
          )}
        >
          <item.icon className="w-5 h-5 mr-3" />
          <span className="flex-1 text-left text-sm font-medium">{item.title}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto">
              {item.badge}
            </Badge>
          )}
        </Button>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 md:p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-center flex-1">
            <span className="text-black">Admin</span>
            <span className="text-blue-600"> Panel</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 hover:bg-gray-100 rounded-full"
            onClick={() => onMobileOpenChange?.(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="space-y-2">
          {sidebarItems.map(item => renderSidebarItem(item))}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent 
          side="right" 
          className="w-80 p-0 border-l [&>button]:hidden z-50"
        >
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AdminSidebar; 