import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserAuth } from '@/contexts/UserAuthContext';

interface ProtectedUserRouteProps {
  children: React.ReactNode;
}

const ProtectedUserRoute: React.FC<ProtectedUserRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useUserAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedUserRoute;
