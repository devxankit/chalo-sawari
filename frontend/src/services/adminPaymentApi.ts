class AdminPaymentApiService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('adminToken') || 
                 localStorage.getItem('token') || 
                 localStorage.getItem('userToken') || 
                 localStorage.getItem('authToken');

    if (!token) {
      throw new Error('Authentication token not found');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Get all payments with pagination and filters
   */
  async getAllPayments(params: {
    page?: number;
    limit?: number;
    status?: string;
    paymentMethod?: string;
    paymentGateway?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  } = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);
      if (params.paymentGateway) queryParams.append('paymentGateway', params.paymentGateway);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.search) queryParams.append('search', params.search);

      const response = await fetch(`${this.apiBaseUrl}/admin/payments?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch payments');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(period: 'week' | 'month' | 'year' = 'month') {
    try {
      const response = await fetch(`${this.apiBaseUrl}/admin/payments/stats?period=${period}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch payment stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch payment stats:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/admin/payments/${paymentId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch payment:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(paymentId: string, amount: number, reason: string) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/admin/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ amount, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process refund');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to process refund:', error);
      throw error;
    }
  }

  /**
   * Get Razorpay payment details
   */
  async getRazorpayDetails(paymentId: string) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/admin/payments/${paymentId}/razorpay-details`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch Razorpay details');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Razorpay details:', error);
      throw error;
    }
  }

  /**
   * Export payments data
   */
  async exportPayments(params: {
    startDate?: string;
    endDate?: string;
    status?: string;
    paymentMethod?: string;
  } = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.status) queryParams.append('status', params.status);
      if (params.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);

      const response = await fetch(`${this.apiBaseUrl}/admin/payments/export/data?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to export payments');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      console.error('Failed to export payments:', error);
      throw error;
    }
  }
}

export default AdminPaymentApiService;
