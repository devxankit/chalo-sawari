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
    
    if (!token) {
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

    try {
      const response = await fetch(url, config);
      
      const data = await response.json();

      if (!response.ok) {
        
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
      throw error;
    }
  }

  async createBooking(bookingData: BookingData): Promise<any> {
    try {
      const response = await this.request('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
      
      return response;
    } catch (error) {
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
