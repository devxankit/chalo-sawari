import React, { ReactNode, useState } from "react";
import AdminTopNavigation from "./AdminTopNavigation";
import AdminSidebar from "./AdminSidebar";
import AdminBottomNavigation from "./AdminBottomNavigation";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 relative">
      <AdminSidebar 
        isMobileOpen={isMobileMenuOpen}
        onMobileOpenChange={setIsMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopNavigation 
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuToggle={setIsMobileMenuOpen}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6 pb-24 md:pb-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile Only */}
      <AdminBottomNavigation />
    </div>
  );
};

export default AdminLayout; 