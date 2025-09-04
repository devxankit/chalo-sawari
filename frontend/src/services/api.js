// Resolve API base URL without hardcoded insecure IPs
const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;
  return import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';
};
const API_BASE_URL = resolveApiBaseUrl();

class ApiService {
  constructor() {
    this.baseURL = resolveApiBaseUrl();
    this.tokens = {
      user: null,
      driver: null,
      admin: null
    };
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.minRequestInterval = 100; // Minimum 100ms between requests
  }

  // Throttle requests to prevent rate limiting
  async throttleRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Check if we're currently on an auth page to prevent redirect loops
  isOnAuthPage() {
    const currentPath = window.location.pathname;
    return currentPath.includes('/auth') || 
           currentPath.includes('/driver-auth') || 
           currentPath.includes('/admin-auth') ||
           currentPath === '/';
  }

  // Get auth token from localStorage
  getAuthToken(role = 'user') {
    const token = (() => {
      switch (role) {
        case 'driver':
          return localStorage.getItem('driverToken');
        case 'admin':
          return localStorage.getItem('adminToken');
        default:
          return localStorage.getItem('token');
      }
    })();
    
    return token;
  }

  // Set auth token in localStorage
  setAuthToken(token, role = 'user') {
    switch (role) {
      case 'driver':
        localStorage.setItem('driverToken', token);
        break;
      case 'admin':
        localStorage.setItem('adminToken', token);
        break;
      default:
        localStorage.setItem('token', token);
    }
  }

  // Remove auth token from localStorage
  removeAuthToken(role = 'user') {
    switch (role) {
      case 'driver':
        localStorage.removeItem('driverToken');
        break;
      case 'admin':
        localStorage.removeItem('adminToken');
        break;
      default:
        localStorage.removeItem('token');
    }
  }

  // Get headers for API requests
  getHeaders(role = 'user') {
    const token = this.getAuthToken(role);
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // Make API request with retry mechanism
  async request(endpoint, options = {}, role = 'user', retryCount = 0) {
    try {
      // Apply throttling to prevent rate limiting
      await this.throttleRequest();
      
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        ...options,
        headers: this.getHeaders(role),
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle rate limiting with retry
        if (response.status === 429 && retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request(endpoint, options, role, retryCount + 1);
        }
        
        // Handle authentication errors
        if (response.status === 401) {
          this.removeAuthToken(role);
          
          // Only redirect if we're not already on an auth page to prevent loops
          if (!this.isOnAuthPage()) {
            // Redirect based on role
            if (role === 'driver') {
              window.location.href = '/driver-auth';
            } else if (role === 'admin') {
              window.location.href = '/admin-auth';
            } else {
              window.location.href = '/auth';
            }
          }
          
          throw new Error('Authentication failed. Please login again.');
        }

        throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication APIs
  async registerUser(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async loginUser(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async verifyOTP(userId, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ userId, otp }),
    });
  }

  async resendOTP(userId, userType = 'user') {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ userId, userType }),
    });
  }

  async logout(role = 'user') {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      }, role);
    } finally {
      this.removeAuthToken(role);
    }
  }

  // Driver APIs
  async registerDriver(driverData) {
    return this.request('/auth/driver/register', {
      method: 'POST',
      body: JSON.stringify(driverData),
    });
  }

  async loginDriver(credentials) {
    return this.request('/auth/driver/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Admin APIs
  async loginAdmin(credentials) {
    return this.request('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // User Profile APIs
  async getUserProfile() {
    return this.request('/user/profile');
  }

  async updateUserProfile(profileData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getUserBookings(status = null, page = 1, limit = 10) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page);
    params.append('limit', limit);

    return this.request(`/user/bookings?${params.toString()}`);
  }

  async getUserWallet() {
    return this.request('/user/wallet');
  }

  async addMoneyToWallet(amount, description) {
    return this.request('/user/wallet/add-money', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    });
  }

  async getUserPreferences() {
    return this.request('/user/preferences');
  }

  async updateUserPreferences(preferences) {
    return this.request('/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  // Vehicle Search APIs
  async searchVehicles(searchParams) {
    const params = new URLSearchParams();
    if (searchParams.from) params.append('from', searchParams.from);
    if (searchParams.to) params.append('to', searchParams.to);
    if (searchParams.date) params.append('date', searchParams.date);
    if (searchParams.time) params.append('time', searchParams.time);
    if (searchParams.type) params.append('type', searchParams.type);

    return this.request(`/vehicles/search?${params.toString()}`);
  }

  async getVehicleDetails(vehicleId) {
    return this.request(`/vehicles/${vehicleId}`);
  }

  // Booking APIs
  async createBooking(bookingData) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getBookingDetails(bookingId) {
    return this.request(`/bookings/${bookingId}`);
  }

  async getBookingReceipt(bookingId) {
    return this.request(`/bookings/${bookingId}/receipt`);
  }

  async updateBookingStatus(bookingId, status, reason = null) {
    return this.request(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason }),
    });
  }

  async cancelBooking(bookingId, reason) {
    return this.request(`/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  async requestCancellation(bookingId, reason) {
    return this.request(`/user/bookings/${bookingId}/request-cancellation`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  }

  // Driver Management APIs
  async getDriverProfile() {
    return this.request('/driver/profile', {}, 'driver');
  }

  async updateDriverProfile(profileData) {
    return this.request('/driver/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }, 'driver');
  }

  async getDriverRequests() {
    return this.request('/driver/requests', {}, 'driver');
  }

  // Driver booking list (matches backend /api/driver/bookings)
  async getDriverBookings(status = null, page = 1, limit = 10) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page);
    params.append('limit', limit);
    return this.request(`/driver/bookings?${params.toString()}`, {}, 'driver');
  }

  // Update driver booking status
  async updateDriverBookingStatus(bookingId, status, extras = {}) {
    return this.request(`/driver/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...extras })
    }, 'driver');
  }

  async updateDriverLocation(latitude, longitude, address) {
    return this.request('/driver/location', {
      method: 'PUT',
      body: JSON.stringify({ latitude, longitude, address }),
    }, 'driver');
  }

  async getDriverEarnings() {
    return this.request('/driver/earnings', {}, 'driver');
  }

  async getDriverStats() {
    return this.request('/driver/stats', {}, 'driver');
  }

  async acceptDriverAgreement(agreementData) {
    return this.request('/driver/accept-agreement', {
      method: 'POST',
      body: JSON.stringify(agreementData),
    }, 'driver');
  }

  // Admin Management APIs
  async getAdminDashboard() {
    return this.request('/admin/dashboard', {}, 'admin');
  }

  async getAllUsers(page = 1, limit = 10, status = null) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);

    return this.request(`/admin/users?${params.toString()}`, {}, 'admin');
  }

  async getAllDrivers(page = 1, limit = 10, status = null) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);

    return this.request(`/admin/drivers?${params.toString()}`, {}, 'admin');
  }

  async verifyDriver(driverId) {
    return this.request(`/admin/drivers/${driverId}/verify`, {
      method: 'PUT',
    }, 'admin');
  }

  async getAllBookings(page = 1, limit = 10, status = null) {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (status) params.append('status', status);

    return this.request(`/admin/bookings?${params.toString()}`, {}, 'admin');
  }

  async getAdminAnalytics() {
    return this.request('/admin/analytics', {}, 'admin');
  }

  // Utility methods
  isAuthenticated(role = 'user') {
    const hasToken = !!this.getAuthToken(role);
    return hasToken;
  }

  getCurrentUserRole() {
    if (this.getAuthToken('admin')) return 'admin';
    if (this.getAuthToken('driver')) return 'driver';
    if (this.getAuthToken('user')) return 'user';
    return null;
  }

  // Error handling
  handleApiError(error) {
    console.error('API Error:', error);
    
    if (error.message.includes('Authentication failed')) {
      // Redirect to login
      window.location.href = '/auth';
      return;
    }

    // You can add more specific error handling here
    return {
      message: error.message || 'An unexpected error occurred',
      type: 'error'
    };
  }
}

// Create and export a single instance
const apiService = new ApiService();
export default apiService;
