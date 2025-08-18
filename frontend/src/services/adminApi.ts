import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const adminApi = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add auth token to requests
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  console.log('Admin API Request:', {
    url: config.url,
    method: config.method,
    hasToken: !!token,
    tokenLength: token ? token.length : 0
  });
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
adminApi.interceptors.response.use(
  (response) => {
    console.log('Admin API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Admin API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/auth';
    }
    return Promise.reject(error);
  }
);

// Admin Authentication
export const adminAuth = {
  login: async (phone: string, password: string) => {
    const response = await adminApi.post('/login', { phone, password });
    return response.data;
  },
  
  signup: async (firstName: string, lastName: string, phone: string, password: string, confirmPassword: string) => {
    const response = await adminApi.post('/signup', { firstName, lastName, phone, password, confirmPassword });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await adminApi.get('/profile');
    return response.data;
  },
  
  updateProfile: async (data: { firstName?: string; lastName?: string; phone?: string }) => {
    const response = await adminApi.put('/profile', data);
    return response.data;
  }
};

// Dashboard & Analytics
export const adminDashboard = {
  getStats: async (period: 'week' | 'month' | 'year' = 'month') => {
    const response = await adminApi.get(`/dashboard?period=${period}`);
    return response.data;
  },
  
  getAnalytics: async (period: 'week' | 'month' | 'year' = 'month') => {
    const response = await adminApi.get(`/analytics?period=${period}`);
    return response.data;
  },
  
  getActivityLog: async (page: number = 1, limit: number = 20) => {
    const response = await adminApi.get(`/activity-log?page=${page}&limit=${limit}`);
    return response.data;
  }
};

// User Management
export const adminUsers = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    
    const response = await adminApi.get(`/users?${queryParams.toString()}`);
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await adminApi.get(`/users/${id}`);
    return response.data;
  },
  
  updateStatus: async (id: string, status: string, reason?: string) => {
    const response = await adminApi.put(`/users/${id}/status`, { status, reason });
    return response.data;
  }
};

// Driver Management
export const adminDrivers = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    isOnline?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    
    const response = await adminApi.get(`/drivers?${queryParams.toString()}`);
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await adminApi.get(`/drivers/${id}`);
    return response.data;
  },
  
  updateStatus: async (id: string, status: string, reason?: string) => {
    const response = await adminApi.put(`/drivers/${id}/status`, { status, reason });
    return response.data;
  }
};

// Vehicle Management
export const adminVehicles = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    isAvailable?: boolean;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    
    const response = await adminApi.get(`/vehicles?${queryParams.toString()}`);
    return response.data;
  },
  
  getPendingApprovals: async (page: number = 1, limit: number = 10) => {
    const response = await adminApi.get(`/vehicles/pending?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getApprovalStats: async () => {
    const response = await adminApi.get('/vehicles/approval-stats');
    return response.data;
  },
  
  approveVehicle: async (id: string, notes?: string) => {
    const response = await adminApi.put(`/vehicles/${id}/approve`, { notes });
    return response.data;
  },
  
  rejectVehicle: async (id: string, reason: string, notes?: string) => {
    const response = await adminApi.put(`/vehicles/${id}/reject`, { reason, notes });
    return response.data;
  }
};

// Booking Management
export const adminBookings = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    
    const response = await adminApi.get(`/bookings?${queryParams.toString()}`);
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await adminApi.get(`/bookings/${id}`);
    return response.data;
  },
  
  updateStatus: async (id: string, status: string, reason?: string) => {
    const response = await adminApi.put(`/bookings/${id}/status`, { status, reason });
    return response.data;
  }
};

export default adminApi;
