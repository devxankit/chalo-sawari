import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '@/contexts/UserAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileAuthWrapperProps {
  children: React.ReactNode;
}

const MobileAuthWrapper: React.FC<MobileAuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useUserAuth();
  const isMobile = useIsMobile();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is on mobile and not authenticated, redirect to login
  if (isMobile && !isAuthenticated) {
    console.log('MobileAuthWrapper: Mobile user not authenticated, redirecting to login');
    return <Navigate to="/auth" state={{ returnUrl: location.pathname }} replace />;
  }

  // For desktop users or authenticated mobile users, render the content
  return <>{children}</>;
};

export default MobileAuthWrapper;
