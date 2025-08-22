interface Offer {
  _id: string;
  title: string;
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OfferResponse {
  success: boolean;
  message?: string;
  data: Offer | Offer[];
  count?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface OfferStats {
  totalOffers: number;
  activeOffers: number;
  inactiveOffers: number;
}

interface OfferStatsResponse {
  success: boolean;
  data: OfferStats;
}

class OfferApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('adminToken');
    console.log('Admin token:', token ? 'Present' : 'Missing');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get all active offers (public)
  async getActiveOffers(): Promise<OfferResponse> {
    const response = await fetch(`${this.baseURL}/offers`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get all offers (admin only)
  async getAllOffers(page = 1, limit = 10, search = '', status = ''): Promise<OfferResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const response = await fetch(`${this.baseURL}/offers/admin?${params}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get offer by ID (admin only)
  async getOfferById(id: string): Promise<OfferResponse> {
    const response = await fetch(`${this.baseURL}/offers/admin/${id}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Create new offer (admin only)
  async createOffer(title: string, image: File): Promise<OfferResponse> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('image', image);

    console.log('Creating offer with:', { title, image: { name: image.name, size: image.size, type: image.type } });

    const headers = this.getAuthHeaders();
    delete headers['Content-Type']; // Let browser set content-type for FormData

    console.log('Request headers:', headers);
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    const response = await fetch(`${this.baseURL}/offers/admin`, {
      method: 'POST',
      headers,
      body: formData
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('Error response:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Update offer (admin only)
  async updateOffer(id: string, title: string, image?: File): Promise<OfferResponse> {
    const formData = new FormData();
    formData.append('title', title);
    if (image) {
      formData.append('image', image);
    }

    const headers = this.getAuthHeaders();
    delete headers['Content-Type']; // Let browser set content-type for FormData

    const response = await fetch(`${this.baseURL}/offers/admin/${id}`, {
      method: 'PUT',
      headers,
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Delete offer (admin only)
  async deleteOffer(id: string): Promise<OfferResponse> {
    const response = await fetch(`${this.baseURL}/offers/admin/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }



  // Get offer statistics (admin only)
  async getOfferStats(): Promise<OfferStatsResponse> {
    const response = await fetch(`${this.baseURL}/offers/admin/stats`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

export const offerApi = new OfferApiService();
export type { Offer, OfferResponse, OfferStats, OfferStatsResponse };
