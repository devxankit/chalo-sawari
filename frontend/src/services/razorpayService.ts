import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrderData {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

export interface RazorpayPaymentData {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  bookingId?: string;
  amount: number;
  paymentMethod: string;
  currency?: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

class RazorpayService {
  private apiBaseUrl: string;
  private razorpayKey: string;

  constructor() {
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    this.razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || '';
  }

  /**
   * Load Razorpay script
   */
  private async loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Create Razorpay order
   */
  async createOrder(orderData: RazorpayOrderData): Promise<any> {
    try {
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('userToken') || 
                   localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${this.apiBaseUrl}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || errorData.message || 'Failed to create order');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * Verify payment with backend
   */
  async verifyPayment(paymentData: RazorpayPaymentData): Promise<any> {
    try {
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('userToken') || 
                   localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const requestBody = {
        razorpayOrderId: paymentData.razorpayOrderId,
        razorpayPaymentId: paymentData.razorpayPaymentId,
        razorpaySignature: paymentData.razorpaySignature,
        bookingId: paymentData.bookingId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        currency: paymentData.currency
      };

      const response = await fetch(`${this.apiBaseUrl}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || errorData.message || 'Payment verification failed');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize Razorpay payment
   */
  async initializePayment(
    orderData: RazorpayOrderData,
    userData: { name: string; email: string; phone: string },
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void,
    onClose: () => void
  ): Promise<void> {
    try {
      // Load Razorpay script
      await this.loadRazorpayScript();

      // Create order
      const order = await this.createOrder(orderData);

      // Configure Razorpay options
      const options: RazorpayOptions = {
        key: this.razorpayKey,
        amount: order.amount, // Amount in paise
        currency: order.currency,
        name: 'Chalo Sawari',
        description: orderData.notes?.description || 'Vehicle Booking Payment',
        order_id: order.orderId,
        handler: onSuccess,
        prefill: {
          name: userData.name,
          email: userData.email,
          contact: userData.phone
        },
        notes: orderData.notes,
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: onClose
        }
      };

      // Initialize Razorpay
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Failed to initialize payment:', error);
      onFailure(error);
    }
  }

  /**
   * Process payment for booking
   */
  async processBookingPayment(
    bookingData: {
      amount: number;
      bookingId: string;
      description: string;
    },
    userData: { name: string; email: string; phone: string },
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void,
    onClose: () => void
  ): Promise<void> {
    try {
      const orderData: RazorpayOrderData = {
        amount: bookingData.amount,
        currency: 'INR',
        receipt: `booking_${bookingData.bookingId}`,
        notes: {
          description: bookingData.description,
          bookingId: bookingData.bookingId,
          type: 'booking'
        }
      };

      await this.initializePayment(
        orderData,
        userData,
        async (response) => {
          try {
            // Verify payment
            const paymentData: RazorpayPaymentData = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingId: bookingData.bookingId,
              amount: response.razorpay_amount || Math.round(bookingData.amount), // Use Razorpay amount or round booking amount
              paymentMethod: 'razorpay', // Fixed: was 'upi', should be 'razorpay'
              currency: 'INR'
            };

            const verificationResult = await this.verifyPayment(paymentData);
            
            toast({
              title: "Payment Successful!",
              description: "Your booking has been confirmed.",
            });

            onSuccess(verificationResult);
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: error instanceof Error ? error.message : "Please contact support",
              variant: "destructive",
            });
            onFailure(error);
          }
        },
        onFailure,
        onClose
      );
    } catch (error) {
      console.error('Failed to process booking payment:', error);
      onFailure(error);
    }
  }

  /**
   * Process wallet recharge
   */
  async processWalletRecharge(
    amount: number,
    userData: { name: string; email: string; phone: string },
    onSuccess: (response: any) => void,
    onFailure: (error: any) => void,
    onClose: () => void
  ): Promise<void> {
    try {
      const orderData: RazorpayOrderData = {
        amount,
        currency: 'INR',
        receipt: `wallet_${Date.now()}`,
        notes: {
          description: 'Wallet Recharge',
          type: 'wallet_recharge'
        }
      };

      await this.initializePayment(
        orderData,
        userData,
        async (response) => {
          try {
            // Verify payment
            const paymentData: RazorpayPaymentData = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              amount: response.razorpay_amount,
              paymentMethod: 'razorpay', // Fixed: was 'upi', should be 'razorpay'
              currency: 'INR'
            };

            const verificationResult = await this.verifyPayment(paymentData);
            
            toast({
              title: "Recharge Successful!",
              description: `₹${amount} has been added to your wallet.`,
            });

            onSuccess(verificationResult);
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: error instanceof Error ? error.message : "Please contact support",
              variant: "destructive",
            });
            onFailure(error);
          }
        },
        onFailure,
        onClose
      );
    } catch (error) {
      console.error('Failed to process wallet recharge:', error);
      onFailure(error);
    }
  }

  /**
   * Get available payment methods
   */
  getPaymentMethods() {
    return [
      {
        id: 'upi',
        name: 'UPI',
        description: 'Pay using UPI ID',
        icon: '📱',
        popular: true
      },
      {
        id: 'card',
        name: 'Credit/Debit Card',
        description: 'Pay using credit or debit card',
        icon: '💳'
      },
      {
        id: 'netbanking',
        name: 'Net Banking',
        description: 'Pay using net banking',
        icon: '🏦'
      },
      {
        id: 'wallet',
        name: 'Digital Wallet',
        description: 'Pay using digital wallets',
        icon: '👛'
      },
      {
        id: 'emi',
        name: 'EMI',
        description: 'Pay in easy installments',
        icon: '📅'
      }
    ];
  }
}

export default RazorpayService;
