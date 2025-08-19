// Types for vehicle pricing
export interface DistanceBasedPricing {
  '50km': number;
  '100km': number;
  '150km': number;
  '200km': number;
}

export interface VehiclePricing {
  _id?: string;
  category: 'auto' | 'car' | 'bus';
  vehicleType: string;
  vehicleModel: string;
  tripType: 'one-way' | 'return';
  distancePricing: DistanceBasedPricing;
  basePrice: number;
  notes?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingCalculationRequest {
  category: 'auto' | 'car' | 'bus';
  vehicleType: string;
  vehicleModel?: string;
  tripType?: 'one-way' | 'return';
  distance: number;
}

export interface PricingCalculationResponse {
  baseFare: number;
  totalFare: number;
  pricing: DistanceBasedPricing;
  category: string;
}

export interface PricingCategoriesResponse {
  _id: string;
  types: {
    type: string;
    models: string[];
  }[];
}

// Base API URL - this should be passed from the calling service
// const API_BASE_URL = '/api/vehicle-pricing';

// Create a service class similar to VehicleApiService
class VehiclePricingApiService {
  private baseURL: string;
  private getAuthHeaders: () => HeadersInit;

  constructor(baseURL: string, getAuthHeaders: () => HeadersInit) {
    this.baseURL = baseURL;
    this.getAuthHeaders = getAuthHeaders;
  }

  // Fetch pricing categories and types
  async getPricingCategories(): Promise<PricingCategoriesResponse[]> {
    try {
      const response = await fetch(`${this.baseURL}/vehicle-pricing/categories`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch pricing categories');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  }

  // Get pricing for a specific vehicle configuration
  async getPricingForVehicle(
    category: 'auto' | 'car' | 'bus',
    vehicleType: string,
    vehicleModel?: string,
    tripType: 'one-way' | 'return' = 'one-way'
  ): Promise<VehiclePricing | null> {
    try {
      const params = new URLSearchParams({
        category,
        vehicleType,
        tripType
      });
      
      if (vehicleModel) {
        params.append('vehicleModel', vehicleModel);
      }

      const response = await fetch(`${this.baseURL}/vehicle-pricing/calculate?${params}`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No pricing found
        }
        throw new Error('Failed to fetch pricing');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  }

  // Get pricing for a vehicle by its ID
  async getPricingForVehicleById(vehicleId: string): Promise<VehiclePricing | null> {
    try {
      const response = await fetch(`${this.baseURL}/vehicle-pricing/vehicle/${vehicleId}`, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No pricing found
        }
        throw new Error('Failed to fetch vehicle pricing');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  }

  // Calculate fare for a trip
  async calculateFare(request: PricingCalculationRequest): Promise<PricingCalculationResponse> {
    try {
      const response = await fetch(`${this.baseURL}/vehicle-pricing/calculate-fare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate fare');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  }

  // Admin functions (require authentication)
  async getAllVehiclePricing(
    token: string,
    filters?: {
      category?: string;
      tripType?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ data: VehiclePricing[]; totalPages: number; currentPage: number; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.tripType) params.append('tripType', filters.tripType);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${this.baseURL}/vehicle-pricing/admin?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vehicle pricing');
      }

      const data = await response.json();
      const payload = data?.data ?? {};
      // Normalize paginate response to a stable shape our UI expects
      return {
        data: Array.isArray(payload.docs) ? payload.docs : Array.isArray(payload) ? payload : [],
        totalPages: typeof payload.totalPages === 'number' ? payload.totalPages : 1,
        currentPage: typeof payload.page === 'number' ? payload.page : 1,
        total: typeof payload.totalDocs === 'number'
          ? payload.totalDocs
          : typeof payload.total === 'number'
          ? payload.total
          : (Array.isArray(payload.docs) ? payload.docs.length : 0),
      };
    } catch (error) {
      throw error;
    }
  }

  async createVehiclePricing(
    token: string,
    pricing: Omit<VehiclePricing, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<VehiclePricing> {
    try {
      const response = await fetch(`${this.baseURL}/vehicle-pricing/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(pricing),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Failed to create vehicle pricing: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  }

  async updateVehiclePricing(
    token: string,
    id: string,
    updates: Partial<VehiclePricing>
  ): Promise<VehiclePricing> {
    try {
      const response = await fetch(`${this.baseURL}/vehicle-pricing/admin/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Failed to update vehicle pricing: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  }

  async deleteVehiclePricing(token: string, id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/vehicle-pricing/admin/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete vehicle pricing');
      }
    } catch (error) {
      throw error;
    }
  }

  async bulkUpdateVehiclePricing(
    token: string,
    pricingData: Omit<VehiclePricing, '_id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<{ action: string; id?: string; error?: string }[]> {
    try {
      const response = await fetch(`${this.baseURL}/vehicle-pricing/admin/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pricingData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to bulk update vehicle pricing');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export the service class
export default VehiclePricingApiService;

// Legacy function exports for backward compatibility
export const getPricingCategories = async (): Promise<PricingCategoriesResponse[]> => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const service = new VehiclePricingApiService(baseURL, () => ({}));
  return service.getPricingCategories();
};

export const getPricingForVehicle = async (
  category: 'auto' | 'car' | 'bus',
  vehicleType: string,
  vehicleModel?: string,
  tripType: 'one-way' | 'return' = 'one-way'
): Promise<VehiclePricing | null> => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const service = new VehiclePricingApiService(baseURL, () => ({}));
  return service.getPricingForVehicle(category, vehicleType, vehicleModel, tripType);
};

// New service-based exports for admin functions
export const getAllVehiclePricing = async (
  token: string,
  filters?: {
    category?: string;
    tripType?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ data: VehiclePricing[]; totalPages: number; currentPage: number; total: number }> => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const service = new VehiclePricingApiService(baseURL, () => ({}));
  return service.getAllVehiclePricing(token, filters);
};

export const createVehiclePricing = async (
  token: string,
  pricing: Omit<VehiclePricing, '_id' | 'createdAt' | 'updatedAt'>
): Promise<VehiclePricing> => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const service = new VehiclePricingApiService(baseURL, () => ({}));
  return service.createVehiclePricing(token, pricing);
};

export const updateVehiclePricing = async (
  token: string,
  id: string,
  updates: Partial<VehiclePricing>
): Promise<VehiclePricing> => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const service = new VehiclePricingApiService(baseURL, () => ({}));
  return service.updateVehiclePricing(token, id, updates);
};

export const deleteVehiclePricing = async (token: string, id: string): Promise<void> => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const service = new VehiclePricingApiService(baseURL, () => ({}));
  return service.deleteVehiclePricing(token, id);
};

export const bulkUpdateVehiclePricing = async (
  token: string,
  pricingData: Omit<VehiclePricing, '_id' | 'createdAt' | 'updatedAt'>[]
): Promise<{ action: string; id?: string; error?: string }[]> => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const service = new VehiclePricingApiService(baseURL, () => ({}));
  return service.bulkUpdateVehiclePricing(token, pricingData);
};
