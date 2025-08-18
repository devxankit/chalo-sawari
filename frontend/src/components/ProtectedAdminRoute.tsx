import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAdminAuth();
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating admin access...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to admin login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin-auth" state={{ from: location }} replace />;
  }
  
  // Admin is authenticated, render the protected route
  return <>{children}</>;
};

export default ProtectedAdminRoute;
