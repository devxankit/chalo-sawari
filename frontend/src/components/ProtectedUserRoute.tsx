import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserAuth } from '@/contexts/UserAuthContext';

interface ProtectedUserRouteProps {
  children: React.ReactNode;
}

const ProtectedUserRoute: React.FC<ProtectedUserRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useUserAuth();
  const location = useLocation();

  // Add some debugging
  useEffect(() => {
    console.log('ProtectedUserRoute: Auth state:', { isAuthenticated, isLoading, pathname: location.pathname });
  }, [isAuthenticated, isLoading, location.pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('ProtectedUserRoute: User not authenticated, redirecting to /auth');
    return <Navigate to="/auth" state={{ returnUrl: location.pathname }} replace />;
  }

  // User is authenticated, render the protected content
  console.log('ProtectedUserRoute: User authenticated, rendering protected content');
  return <>{children}</>;
};

export default ProtectedUserRoute;
