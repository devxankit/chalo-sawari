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
  login: (phone: string, otp: string) => Promise<void>;
  sendOTP: (phone: string, purpose: 'signup' | 'login') => Promise<void>;
  verifyOTP: (phone: string, otp: string, purpose: 'signup' | 'login', driverData?: any) => Promise<void>;
  resendOTP: (phone: string, purpose: 'signup' | 'login') => Promise<void>;
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

  const login = async (phone: string, otp: string) => {
    try {
      setIsLoading(true);
      // Remove country code if present
      const phoneNumber = phone.replace(/[^0-9]/g, '');
      
      console.log('Attempting driver login with:', { phone: phoneNumber, otp });
      
      const response = await apiService.verifyDriverOTP(phoneNumber, otp, 'login');
      
      console.log('Driver login response:', response);
      
      if (response.success && response.token) {
        console.log('Driver login successful, setting token and driver data');
        // Set token first
        apiService.setAuthToken(response.token, 'driver');
        
        // Store in localStorage
        localStorage.setItem('isDriverLoggedIn', 'true');
        localStorage.setItem('driverPhone', phoneNumber);
        
        // Fetch complete driver profile data
        try {
          const profileResponse = await apiService.getDriverProfile();
          if (profileResponse.success) {
            const driverData = profileResponse.data?.driver || profileResponse.data;
            setDriver(driverData);
          } else {
            // Fallback to basic driver data from login response
            setDriver(response.driver);
          }
        } catch (profileError) {
          console.warn('Failed to fetch complete driver profile, using basic driver data:', profileError);
          // Fallback to basic driver data from login response
          setDriver(response.driver);
        }
        
        setIsLoggedIn(true);
        
        // Redirect to driver dashboard after successful login
        window.location.href = '/driver';
      } else {
        console.log('Driver login failed:', response);
        throw new Error(response.error?.message || response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Driver login error:', error);
      // Clear any partial state on error
      apiService.removeAuthToken('driver');
      setDriver(null);
      setIsLoggedIn(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (phone: string, purpose: 'signup' | 'login') => {
    try {
      const response = await apiService.sendDriverOTP(phone, purpose);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to send OTP');
      }
      
      // Debug: Show OTP in console for development
      if (response.data && response.data.otp) {
        console.log(`🔑 OTP for ${phone}: ${response.data.otp}`);
        console.log(`📱 Purpose: ${purpose}`);
        console.log(`🧪 Is Test Driver: ${response.data.isTestDriver}`);
        console.log(`🔧 Is Development: ${response.data.isDevelopment}`);
      }
      
      return response;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw error;
    }
  };

  const verifyOTP = async (phone: string, otp: string, purpose: 'signup' | 'login', driverData?: any) => {
    try {
      console.log(`🔍 Verifying OTP for ${phone}: ${otp}, Purpose: ${purpose}`);
      
      const response = await apiService.verifyDriverOTP(phone, otp, purpose, driverData);
      
      console.log('🔍 OTP Verification Response:', response);
      
      if (response.success) {
        if (purpose === 'login' && response.token) {
          console.log('✅ Login successful, storing token');
          // Store the token for login
          apiService.setAuthToken(response.token, 'driver');
          
          // Store in localStorage
          localStorage.setItem('isDriverLoggedIn', 'true');
          localStorage.setItem('driverPhone', phone);
          
          // Fetch complete driver profile
          await refreshDriverData();
          setIsLoggedIn(true);
        }
        // For signup, just return success - no token needed
        return response;
      } else {
        throw new Error(response.error?.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  };

  const resendOTP = async (phone: string, purpose: 'signup' | 'login') => {
    try {
      const response = await apiService.resendDriverOTP(phone, purpose);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to resend OTP');
      }
      return response;
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error;
    }
  };

  const logout = () => {
    try {
      console.log('Logging out driver');
      // Clear driver data first
      setDriver(null);
      setIsLoggedIn(false);
      
      // Then clear token and localStorage
      apiService.removeAuthToken('driver');
      localStorage.removeItem('isDriverLoggedIn');
      localStorage.removeItem('driverPhone');
      
      // Redirect to driver auth page
      window.location.href = '/driver/auth';
    } catch (error) {
      console.error('Driver logout error:', error);
      // Force clear state even if there's an error
      setDriver(null);
      setIsLoggedIn(false);
      apiService.removeAuthToken('driver');
      localStorage.removeItem('isDriverLoggedIn');
      localStorage.removeItem('driverPhone');
      window.location.href = '/driver/auth';
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
    sendOTP,
    verifyOTP,
    resendOTP,
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
