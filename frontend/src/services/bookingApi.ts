import { toast } from '@/hooks/use-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface BookingData {
  vehicleId: string;
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  date: string;
  time: string;
  tripType?: string;
  passengers: number;
  paymentMethod: 'cash' | 'razorpay';
  specialRequests?: string;
}

class BookingApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get auth token from localStorage - check multiple possible keys
    let token = localStorage.getItem('token') || 
                localStorage.getItem('userToken') || 
                localStorage.getItem('authToken');
    
    console.log('Debug - API Request Details:');
    console.log('Debug - URL:', url);
    console.log('Debug - Token exists:', !!token);
    console.log('Debug - Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
    console.log('Debug - All localStorage keys:', Object.keys(localStorage));
    
    if (!token) {
      console.error('Debug - No authentication token found! User must be logged in.');
      throw new Error('Authentication required. Please log in to book a vehicle.');
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    console.log('Debug - Request headers:', config.headers);

    try {
      const response = await fetch(url, config);
      console.log('Debug - Response status:', response.status);
      console.log('Debug - Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Debug - Response data:', data);

      if (!response.ok) {
        console.error('Debug - Request failed with status:', response.status);
        console.error('Debug - Error data:', data);
        
        // Provide more specific error messages
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 400) {
          const errorDetails = data.error?.details || [];
          const fieldErrors = errorDetails.map((err: any) => `${err.field}: ${err.message}`).join(', ');
          throw new Error(`Validation failed: ${fieldErrors || data.error?.message || 'Invalid data'}`);
        } else {
          throw new Error(data.error?.message || data.message || 'Something went wrong');
        }
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async createBooking(bookingData: BookingData) {
    try {
      const response = await this.request('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });

      toast({
        title: "Booking Successful!",
        description: "Your vehicle has been booked successfully.",
      });

      return response;
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  }

  async getUserBookings(status?: string, page: number = 1, limit: number = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }

    return this.request(`/bookings?${params.toString()}`);
  }

  async getBookingById(bookingId: string) {
    return this.request(`/bookings/${bookingId}`);
  }

  async cancelBooking(bookingId: string, reason?: string) {
    const body = reason ? { reason } : {};
    
    return this.request(`/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async updateBookingStatus(bookingId: string, status: string) {
    return this.request(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
}

export default BookingApiService;
