import React, { createContext, useContext, useEffect, useState } from 'react';
import apiService from '@/services/api';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture?: string;
  location?: string;
  wallet: {
    balance: number;
    transactions: Array<{
      type: 'credit' | 'debit';
      amount: number;
      description: string;
      date: string;
    }>;
  };
  preferences: {
    preferredVehicleType: string;
    preferredSeat: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};

interface UserAuthProviderProps {
  children: React.ReactNode;
}

export const UserAuthProvider: React.FC<UserAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        console.log('Checking auth status...');
        
        // Check if we have a token first
        const hasToken = apiService.isAuthenticated();
        console.log('Token check result:', hasToken);
        
        if (hasToken) {
          console.log('Token found, attempting to refresh user data');
          await refreshUser();
        } else {
          console.log('No token found, user not authenticated');
          // Clear any stale user data
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid tokens and user data
        apiService.removeAuthToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (phone: string, otp: string) => {
    try {
      setIsLoading(true);
      // Remove country code if present
      const phoneNumber = phone.replace(/[^0-9]/g, '');
      
      console.log('Attempting login with:', { phone: phoneNumber, otp });
      
      const response = await apiService.verifyOTP(phoneNumber, otp, 'login');
      
      console.log('Login response:', response);
      
      if (response.success && response.token) {
        console.log('Login successful, setting token and user');
        // Set token first
        apiService.setAuthToken(response.token);
        
        // Test token storage
        const storedToken = apiService.getAuthToken();
        console.log('Stored token test:', storedToken ? 'Token found' : 'No token found');
        
        // Fetch complete user profile data
        try {
          const profileResponse = await apiService.getUserProfile();
          if (profileResponse.success) {
            const userData = profileResponse.data?.user || profileResponse.data;
            setUser(userData);
          } else {
            // Fallback to basic user data from login response
            setUser(response.user);
          }
        } catch (profileError) {
          console.warn('Failed to fetch complete profile, using basic user data:', profileError);
          // Fallback to basic user data from login response
          setUser(response.user);
        }
        
        // Redirect to home page after successful login
        window.location.href = '/';
      } else {
        console.log('Login failed:', response);
        throw new Error(response.error?.message || response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial state on error
      apiService.removeAuthToken();
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await apiService.registerUser(userData);
      
      if (response.success) {
        // After successful registration, user needs to verify OTP
        // You might want to handle this differently based on your flow
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      console.log('Logging out user');
      // Clear user data first
      setUser(null);
      // Then clear token
      apiService.removeAuthToken();
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear state even if there's an error
      setUser(null);
      apiService.removeAuthToken();
      window.location.href = '/';
    }
  };

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      setIsLoading(true);
      const response = await apiService.updateUserProfile(profileData);
      
      if (response.success) {
        // Fix: Handle the nested data structure from backend
        const updatedUser = response.data?.user || response.data;
        setUser(updatedUser);
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      console.log('Refreshing user data');
      const response = await apiService.getUserProfile();
      console.log('Profile API response:', response);
      
      if (response.success) {
        // Fix: Handle the nested data structure from backend
        const userData = response.data?.user || response.data;
        console.log('User data refreshed successfully:', userData);
        setUser(userData);
      } else {
        console.log('Failed to refresh user data:', response.message);
        throw new Error(response.message || 'Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
      // If refresh fails, clear the invalid token and user data
      apiService.removeAuthToken();
      setUser(null);
      throw error;
    }
  };

  const value: UserAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {children}
    </UserAuthContext.Provider>
  );
};
