interface VehicleImage {
  _id: string;
  url: string;
  caption?: string;
  isPrimary: boolean;
}

interface VehicleDocument {
  rc: {
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
  puc?: {
    number: string;
    expiryDate: string;
    image?: string;
    isVerified: boolean;
  };
}

interface VehiclePricingReference {
  category: 'auto' | 'car' | 'bus';
  vehicleType: string;
  vehicleModel: string;
}

interface VehicleSchedule {
  workingDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
}

interface VehicleOperatingArea {
  cities: string[];
  states: string[];
}

interface VehicleMaintenance {
  lastService?: string;
  nextService?: string;
  serviceHistory: Array<{
    date: string;
    description: string;
    cost: number;
    serviceCenter: string;
    odometer: number;
  }>;
  isUnderMaintenance: boolean;
  maintenanceReason?: string;
}

interface VehicleRatings {
  average: number;
  count: number;
  breakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface VehicleStatistics {
  totalTrips: number;
  totalDistance: number;
  totalEarnings: number;
  averageRating: number;
}

export interface Vehicle {
  _id: string;
  driver: string;
  type: 'bus' | 'car' | 'auto';
  brand: string;
  model: string;
  year: number;
  color: string;
  fuelType: 'petrol' | 'diesel' | 'cng' | 'electric' | 'hybrid';
  transmission: 'manual' | 'automatic';
  seatingCapacity: number;
  engineCapacity?: number;
  mileage?: number;
  isAc: boolean;
  isSleeper: boolean;
  amenities: string[];
  images: VehicleImage[];
  documents: VehicleDocument;
  registrationNumber: string;
  chassisNumber?: string;
  engineNumber?: string;
  isAvailable: boolean;
  isActive: boolean;
  isVerified: boolean;
  isApproved: boolean;
  currentLocation?: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
    lastUpdated?: string;
  };
  pricingReference: VehiclePricingReference;
  // Computed pricing field - will be populated with actual pricing data
  computedPricing?: {
    basePrice: number;
    distancePricing: {
      '50km': number;
      '100km': number;
      '150km': number;
      '200km': number;
    };
    category: string;
    vehicleType: string;
    vehicleModel: string;
  };
  schedule: VehicleSchedule;
  operatingArea: VehicleOperatingArea;
  maintenance: VehicleMaintenance;
  ratings: VehicleRatings;
  statistics: VehicleStatistics;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleData {
  type: 'bus' | 'car' | 'auto';
  brand: string;
  model: string;
  year: number;
  color: string;
  fuelType: 'petrol' | 'diesel' | 'cng' | 'electric' | 'hybrid';
  transmission?: 'manual' | 'automatic';
  seatingCapacity: number;
  engineCapacity?: number;
  mileage?: number;
  isAc?: boolean;
  isSleeper?: boolean;
  amenities?: string[];
  registrationNumber: string;
  chassisNumber?: string;
  engineNumber?: string;
  rcNumber: string;
  rcExpiryDate: string;
  insuranceNumber?: string;
  insuranceExpiryDate?: string;
  fitnessNumber?: string;
  fitnessExpiryDate?: string;
  permitNumber?: string;
  permitExpiryDate?: string;
  pucNumber?: string;
  pucExpiryDate?: string;
  pricingReference?: {
    category: 'auto' | 'car' | 'bus';
    vehicleType: string;
    vehicleModel: string;
  };
  workingDays?: string[];
  workingHoursStart?: string;
  workingHoursEnd?: string;
  operatingCities?: string[];
  operatingStates?: string[];
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> {}

export interface VehicleFilters {
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'inactive' | 'maintenance';
  type?: 'all' | 'bus' | 'car' | 'auto';
}

export interface VehicleResponse {
  success: boolean;
  message?: string;
  data: Vehicle | Vehicle[] | { docs: Vehicle[]; totalDocs: number; limit: number; page: number; totalPages: number };
}

class VehicleApiService {
  private baseURL: string;
  private getAuthHeaders: () => HeadersInit;

  constructor(baseURL: string, getAuthHeaders: () => HeadersInit) {
    this.baseURL = baseURL;
    this.getAuthHeaders = getAuthHeaders;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<VehicleResponse> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any));
      // Surface backend validation details if present
      const details = (errorData?.error?.details || errorData?.details) as Array<{ field: string; message: string }>|undefined;
      const detailMsg = details && details.length
        ? ` | ${details.map(d => `${d.field}: ${d.message}`).join('; ')}`
        : '';
      const msg = (errorData?.error?.message || errorData?.message || `HTTP error! status: ${response.status}`) + detailMsg;
      throw new Error(msg);
    }

    return response.json();
  }

  // Create a new vehicle
  async createVehicle(vehicleData: CreateVehicleData): Promise<VehicleResponse> {
    return this.makeRequest('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  }

  // Get driver's vehicles
  async getDriverVehicles(filters: VehicleFilters = {}): Promise<VehicleResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    return this.makeRequest(`/vehicles/driver/my-vehicles?${params.toString()}`);
  }

  // Get vehicle by ID
  async getVehicleById(vehicleId: string): Promise<VehicleResponse> {
    return this.makeRequest(`/vehicles/${vehicleId}`);
  }

  // Populate computed pricing for vehicles
  async populateVehiclePricing(vehicles: Vehicle[]): Promise<Vehicle[]> {
    const { getPricingForVehicle } = await import('./vehiclePricingApi');
    
    const vehiclesWithPricing = await Promise.all(
      vehicles.map(async (vehicle) => {
        try {
          if (vehicle.pricingReference) {
            const pricing = await getPricingForVehicle(
              vehicle.pricingReference.category,
              vehicle.pricingReference.vehicleType,
              vehicle.pricingReference.vehicleModel
            );
            
            if (pricing) {
              vehicle.computedPricing = {
                basePrice: pricing.basePrice,
                distancePricing: pricing.distancePricing,
                category: pricing.category,
                vehicleType: pricing.vehicleType,
                vehicleModel: pricing.vehicleModel
              };
            }
          }
          return vehicle;
        } catch (error) {
          console.error(`Error fetching pricing for vehicle ${vehicle._id}:`, error);
          return vehicle;
        }
      })
    );
    
    return vehiclesWithPricing;
  }

  // Update vehicle
  async updateVehicle(vehicleId: string, updateData: UpdateVehicleData): Promise<VehicleResponse> {
    return this.makeRequest(`/vehicles/${vehicleId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Delete vehicle
  async deleteVehicle(vehicleId: string): Promise<VehicleResponse> {
    return this.makeRequest(`/vehicle/${vehicleId}`, {
      method: 'DELETE',
    });
  }

  // Upload vehicle images
  async uploadVehicleImages(vehicleId: string, images: File[]): Promise<VehicleResponse> {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append('images', image);
    });

    const headers = this.getAuthHeaders();
    delete headers['Content-Type']; // Let browser set content-type for FormData

    const response = await fetch(`${this.baseURL}/vehicles/${vehicleId}/images`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Remove vehicle image
  async removeVehicleImage(vehicleId: string, imageId: string): Promise<VehicleResponse> {
    return this.makeRequest(`/vehicles/${vehicleId}/images/${imageId}`, {
      method: 'DELETE',
    });
  }

  // Search vehicles (public)
  async searchVehicles(searchParams: {
    pickup?: string;
    destination?: string;
    date?: string;
    passengers?: number;
    vehicleType?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<VehicleResponse> {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    return this.makeRequest(`/vehicles/search?${params.toString()}`);
  }

  // Get vehicle types (public)
  async getVehicleTypes(): Promise<VehicleResponse> {
    return this.makeRequest('/vehicles/types');
  }

  // Get nearby vehicles (public)
  async getNearbyVehicles(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    vehicleType?: string;
    passengers?: number;
  }): Promise<VehicleResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });

    return this.makeRequest(`/vehicles/nearby?${queryParams.toString()}`);
  }

  // Estimate fare (public)
  async estimateFare(estimateData: {
    vehicleId: string;
    pickup: { latitude: number; longitude: number; address: string };
    destination: { latitude: number; longitude: number; address: string };
    passengers?: number;
    date?: string;
    time?: string;
  }): Promise<VehicleResponse> {
    return this.makeRequest('/vehicles/estimate-fare', {
      method: 'POST',
      body: JSON.stringify(estimateData),
    });
  }

  // Get vehicle reviews (public)
  async getVehicleReviews(vehicleId: string, page: number = 1, limit: number = 10): Promise<VehicleResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    return this.makeRequest(`/vehicles/${vehicleId}/reviews?${params.toString()}`);
  }

  // Update vehicle location (driver only)
  async updateVehicleLocation(vehicleId: string, locationData: {
    latitude: number;
    longitude: number;
    address?: string;
  }): Promise<VehicleResponse> {
    return this.makeRequest(`/vehicles/${vehicleId}/location`, {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  }

  // Update vehicle availability (driver only)
  async updateVehicleAvailability(vehicleId: string, availabilityData: {
    isAvailable: boolean;
    reason?: string;
  }): Promise<VehicleResponse> {
    return this.makeRequest(`/vehicles/${vehicleId}/availability`, {
      method: 'PUT',
      body: JSON.stringify(availabilityData),
    });
  }

  // Get vehicle maintenance (driver only)
  async getVehicleMaintenance(vehicleId: string): Promise<VehicleResponse> {
    return this.makeRequest(`/vehicles/${vehicleId}/maintenance`);
  }

  // Add maintenance record (driver only)
  async addMaintenanceRecord(vehicleId: string, maintenanceData: {
    type: 'service' | 'repair' | 'inspection' | 'cleaning' | 'other';
    description: string;
    cost: number;
    date: string;
    nextServiceDate?: string;
    serviceCenter?: string;
  }): Promise<VehicleResponse> {
    return this.makeRequest(`/vehicles/${vehicleId}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(maintenanceData),
    });
  }
}

export default VehicleApiService;
