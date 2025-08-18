import React from 'react';
import { Navigate } from 'react-router-dom';
import { useDriverAuth } from '@/contexts/DriverAuthContext';

interface ProtectedDriverRouteProps {
  children: React.ReactNode;
}

const ProtectedDriverRoute: React.FC<ProtectedDriverRouteProps> = ({ children }) => {
  const { isLoggedIn, isLoading } = useDriverAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/driver-auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedDriverRoute;
