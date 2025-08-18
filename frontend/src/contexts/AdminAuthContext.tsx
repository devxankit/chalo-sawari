import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import adminApi from '../services/adminApi';

interface AdminData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  token: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminData: AdminData | null;
  isLoading: boolean;
  login: (adminData: AdminData) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const adminDataStr = localStorage.getItem('adminData');

      if (adminToken && adminDataStr) {
        const parsedAdminData = JSON.parse(adminDataStr);
        
        // Validate the data structure
        if (parsedAdminData && parsedAdminData.id && parsedAdminData.token) {
          // Check if token matches
          if (parsedAdminData.token === adminToken) {
            setAdminData(parsedAdminData);
            setIsAuthenticated(true);
          } else {
            // Token mismatch, clear data
            clearAuth();
          }
        } else {
          // Invalid data structure, clear
          clearAuth();
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking admin auth status:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdminData(null);
    setIsAuthenticated(false);
  };

  const login = (newAdminData: AdminData) => {
    localStorage.setItem('adminToken', newAdminData.token);
    localStorage.setItem('adminData', JSON.stringify(newAdminData));
    setAdminData(newAdminData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearAuth();
  };

  const checkAuth = (): boolean => {
    return isAuthenticated && adminData !== null;
  };

  const value: AdminAuthContextType = {
    isAuthenticated,
    adminData,
    isLoading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};
