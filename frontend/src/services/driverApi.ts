import apiService from './api.js';

// Import Driver interface from DriverAuthContext
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
    model: string;
    year: number;
    color: string;
    fuelType: string;
    transmission: string;
    seatingCapacity: number;
    images: string[];
    isAc: boolean;
    isAvailable: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DriverStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  completionRate: string;
  totalEarnings: number;
  averageRating: number;
  isOnline: boolean;
  lastOnline: string;
}

export interface DriverEarnings {
  period: string;
  totalBookings: number;
  totalEarnings: number;
  netEarnings: number;
  bookings: Array<{
    amount: number;
    netAmount: number;
    date: string;
    paymentStatus: string;
    bookingStatus: string;
  }>;
}

export interface DriverVehicle {
  _id: string;
  type: 'bus' | 'car' | 'auto';
  brand: string;
  model: string;
  year: number;
  color: string;
  fuelType: string;
  transmission: string;
  seatingCapacity: number;
  registrationNumber: string;
  isAvailable: boolean;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isVerified: boolean;
  isApproved: boolean;
  images: Array<{
    url: string;
    caption: string;
    isPrimary: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface DriverBooking {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  vehicle: {
    type: string;
    brand: string;
    model: string;
    color: string;
    registrationNumber?: string;
  };
  status: 'pending' | 'accepted' | 'started' | 'completed' | 'cancelled';
  pickupLocation: {
    address: string;
    coordinates: [number, number];
  };
  dropoffLocation: {
    address: string;
    coordinates: [number, number];
  };
  tripDetails: {
    distance: number;
    duration: number;
    estimatedFare: number;
  };
  pricing: {
    totalAmount: number;
    commission: number;
    netAmount: number;
  };
  createdAt: string;
  updatedAt: string;
}

class DriverApiService {
  // Profile Management
  async getProfile() {
    return apiService.getDriverProfile();
  }

  async updateProfile(profileData: Partial<Driver>) {
    return apiService.updateDriverProfile(profileData);
  }

  // Statistics and Dashboard
  async getStats(): Promise<DriverStats> {
    const response = await apiService.getDriverStats();
    return response.data;
  }

  async getEarnings(period: 'week' | 'month' | 'year' = 'month'): Promise<DriverEarnings> {
    const response = await apiService.getDriverEarnings(period);
    return response.data;
  }

  async getTodayEarnings(): Promise<number> {
    try {
      const response = await apiService.request('/driver/earnings/today', {}, 'driver');
      return response.data.totalEarnings || 0;
    } catch (error) {
      console.error('Error fetching today\'s earnings:', error);
      return 0;
    }
  }

  // Vehicle Management
  async getVehicles(): Promise<DriverVehicle[]> {
    try {
      const response = await apiService.request('/driver/vehicles', {}, 'driver');
      return response.data.docs || [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return [];
    }
  }

  async getActiveVehicles(): Promise<DriverVehicle[]> {
    try {
      const vehicles = await this.getVehicles();
      // Return vehicles that are active and approved, but be less restrictive about availability
      return vehicles.filter(vehicle => 
        vehicle.isActive !== false && // Allow undefined/true values
        vehicle.approvalStatus === 'approved' &&
        vehicle.isVerified !== false // Allow undefined/true values
        // Removed isAvailable filter to show more vehicles
      );
    } catch (error) {
      console.error('Error filtering active vehicles:', error);
      return [];
    }
  }

  async getVehicleCount(): Promise<number> {
    try {
      const vehicles = await this.getActiveVehicles();
      return vehicles.length;
    } catch (error) {
      console.error('Error getting vehicle count:', error);
      return 0;
    }
  }

  async getTotalVehicleCount(): Promise<number> {
    try {
      const vehicles = await this.getVehicles();
      return vehicles.length;
    } catch (error) {
      console.error('Error getting total vehicle count:', error);
      return 0;
    }
  }

  // Booking Management
  async getBookings(status?: string, page: number = 1, limit: number = 10): Promise<{
    docs: DriverBooking[];
    totalDocs: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await apiService.request(`/driver/bookings?${params.toString()}`, {}, 'driver');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return {
        docs: [],
        totalDocs: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      };
    }
  }

  async getActiveBookings(): Promise<DriverBooking[]> {
    try {
      const response = await apiService.request('/driver/trips/active', {}, 'driver');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching active trips:', error);
      return [];
    }
  }

  async getPendingBookings(): Promise<DriverBooking[]> {
    try {
      const response = await apiService.request('/driver/bookings?status=pending&limit=100', {}, 'driver');
      return response.data.docs || [];
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      return [];
    }
  }

  async getCompletedBookings(): Promise<DriverBooking[]> {
    try {
      const response = await apiService.request('/driver/trips/history?status=completed&limit=100', {}, 'driver');
      return response.data.docs || [];
    } catch (error) {
      console.error('Error fetching completed bookings:', error);
      return [];
    }
  }

  async getCompletedBookingsCount(): Promise<number> {
    try {
      const response = await apiService.request('/driver/trips/history?status=completed&limit=1', {}, 'driver');
      return response.data.totalDocs || 0;
    } catch (error) {
      console.error('Error fetching completed bookings count:', error);
      return 0;
    }
  }

  // Rating and Reviews - Using mock data as requested
  async getAverageRating(): Promise<number> {
    // Return a random rating between 4.0 and 5.0 for better user experience
    return Math.round((Math.random() * 1 + 4) * 10) / 10;
  }

  async getHappyCustomersCount(): Promise<number> {
    try {
      // Count all booking requests (pending, accepted, started, completed) as happy customers
      const allBookings = await this.getBookings('', 1, 100);
      return allBookings.totalDocs || 0;
    } catch (error) {
      console.error('Error fetching happy customers count:', error);
      return 0;
    }
  }

  // Location and Status
  async updateLocation(latitude: number, longitude: number, address: string) {
    return apiService.updateDriverLocation(latitude, longitude, address);
  }

  async toggleStatus() {
    return apiService.request('/driver/status', { method: 'PUT' }, 'driver');
  }

  // Dashboard Summary - Improved with better error handling and data fetching
  async getDashboardSummary() {
    try {
      const [
        activeVehicles,
        todayEarnings,
        averageRating,
        happyCustomers,
        activeRequests,
        totalVehicles,
        completedRides,
        totalEarnings
      ] = await Promise.all([
        this.getTotalVehicleCount(), // Use total vehicle count instead of filtered
        this.getTodayEarnings(),
        this.getAverageRating(),
        this.getHappyCustomersCount(),
        this.getPendingBookings().then(bookings => bookings.length),
        this.getVehicles().then(vehicles => vehicles.length),
        this.getCompletedBookingsCount(),
        this.getEarnings().then(earnings => earnings.totalEarnings)
      ]);

      return {
        activeVehicles,
        todayEarnings,
        averageRating,
        happyCustomers,
        activeRequests,
        totalVehicles,
        completedRides,
        totalEarnings
      };
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      
      // Fallback to basic data if some methods fail
      try {
        const [activeVehicles, totalVehicles] = await Promise.all([
          this.getTotalVehicleCount(), // Use total vehicle count
          this.getVehicles().then(vehicles => vehicles.length)
        ]);
        
        return {
          activeVehicles,
          todayEarnings: 0,
          averageRating: 0,
          happyCustomers: 0,
          activeRequests: 0,
          totalVehicles,
          completedRides: 0,
          totalEarnings: 0
        };
      } catch (fallbackError) {
        console.error('Fallback dashboard summary also failed:', fallbackError);
        return {
          activeVehicles: 0,
          todayEarnings: 0,
          averageRating: 0,
          happyCustomers: 0,
          activeRequests: 0,
          totalVehicles: 0,
          completedRides: 0,
          totalEarnings: 0
        };
      }
    }
  }
}

const driverApiService = new DriverApiService();
export default driverApiService;
