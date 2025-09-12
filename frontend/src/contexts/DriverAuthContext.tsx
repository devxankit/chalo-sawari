import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '@/services/api.js';

interface Driver {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'driver';
  isVerified: boolean;
  isApproved: boolean;
  profilePicture?: string;
  agreement?: {
    isAccepted: boolean;
    acceptedAt?: string;
    ipAddress?: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  dateOfBirth?: string;
  gender?: string;
  rating?: number;
  reviewCount?: number;
  totalRides?: number;
  totalEarnings?: number;
  currentLocation?: {
    coordinates: [number, number];
    address: string;
    lastUpdated: string;
  };
  availability?: {
    isOnline: boolean;
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: string[];
  };
  earnings?: {
    wallet: {
      balance: number;
      transactions: Array<{
        type: 'credit' | 'debit';
        amount: number;
        description: string;
        date: string;
      }>;
    };
    commission: number;
  };
  documents?: {
    drivingLicense: {
      number: string;
      expiryDate: string;
      image?: string;
      isVerified: boolean;
    };
    vehicleRC: {
      number: string;
      expiryDate: string;
      image?: string;
      isVerified: boolean;
    };
    insurance?: {
      number: string;
      expiryDate: string;
      image?: string;
      isVerified: boolean;
    };
    fitness?: {
      number: string;
      expiryDate: string;
      image?: string;
      isVerified: boolean;
    };
    permit?: {
      number: string;
      expiryDate: string;
      image?: string;
      isVerified: boolean;
    };
  };
  vehicleDetails?: {
    type: string;
    brand: string;
    fuelType: string;
    seatingCapacity: number;
    images: string[];
    isAc: boolean;
    isAvailable: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface DriverAuthContextType {
  driver: Driver | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateDriverData: (data: Partial<Driver>) => void;
  refreshDriverData: () => Promise<void>;
}

const DriverAuthContext = createContext<DriverAuthContextType | undefined>(undefined);

export const useDriverAuth = () => {
  const context = useContext(DriverAuthContext);
  if (context === undefined) {
    throw new Error('useDriverAuth must be used within a DriverAuthProvider');
  }
  return context;
};

interface DriverAuthProviderProps {
  children: React.ReactNode;
}

export const DriverAuthProvider: React.FC<DriverAuthProviderProps> = ({ children }) => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDriverData = useCallback(async () => {
    try {
      if (!localStorage.getItem('driverToken')) {
        return;
      }
      
      const response = await apiService.getDriverProfile();
      if (response.success && response.data) {
        setDriver(response.data);
      }
    } catch (error) {
      console.error('Error refreshing driver data:', error);
      // If there's an auth error, logout the user
      if (error instanceof Error && error.message.includes('Authentication failed')) {
        logout();
      }
    }
  }, []);

  // Debounced version of refreshDriverData
  const debouncedRefreshDriverData = useCallback(() => {
    const timeoutId = setTimeout(() => {
      refreshDriverData();
    }, 1000); // 1 second delay
    
    return () => clearTimeout(timeoutId);
  }, [refreshDriverData]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('driverToken');
      const isDriverLoggedIn = localStorage.getItem('isDriverLoggedIn');

      // Allow access if token exists to prevent blank screens during slow profile fetch
      if (token) {
        setIsLoggedIn(true);
        // Fetch driver profile in background without blocking route
        debouncedRefreshDriverData();
        setIsLoading(false);
        return;
      }

      if (!token || !isDriverLoggedIn) {
        setIsLoggedIn(false);
        setDriver(null);
        setIsLoading(false);
        return;
      }

      // Fallback: try to get driver info from backend
      debouncedRefreshDriverData();
      setIsLoggedIn(true);
      
    } catch (error) {
      console.error('Error checking auth:', error);
      // Clear all auth data on error
      setIsLoggedIn(false);
      setDriver(null);
      localStorage.removeItem('driverToken');
      localStorage.removeItem('isDriverLoggedIn');
      localStorage.removeItem('driverPhone');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await apiService.loginDriver({ phone, password });
      
      if (response.success && response.token) {
        // Store the token
        apiService.setAuthToken(response.token, 'driver');
        
        // Store in localStorage
        localStorage.setItem('isDriverLoggedIn', 'true');
        localStorage.setItem('driverPhone', phone);
        
        // Fetch complete driver profile
        await refreshDriverData();
        setIsLoggedIn(true);
        
        return response;
      } else {
        throw new Error(response.error?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    try {
      // Clear all auth data
      setDriver(null);
      setIsLoggedIn(false);
      
      // Remove tokens and localStorage
      apiService.removeAuthToken('driver');
      localStorage.removeItem('isDriverLoggedIn');
      localStorage.removeItem('driverPhone');
      
      // Try to call logout endpoint (but don't wait for it)
      apiService.logout('driver').catch(console.error);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateDriverData = (data: Partial<Driver>) => {
    if (driver) {
      setDriver({ ...driver, ...data });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: DriverAuthContextType = {
    driver,
    isLoggedIn,
    isLoading,
    login,
    logout,
    checkAuth,
    updateDriverData,
    refreshDriverData,
  };

  return (
    <DriverAuthContext.Provider value={value}>
      {children}
    </DriverAuthContext.Provider>
  );
};
