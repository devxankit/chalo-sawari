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
    // Use network IP when accessing from mobile devices
    const isNetworkAccess = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
      (isNetworkAccess ? 'http://10.26.183.12:5000/api' : 'http://localhost:5000/api');
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
      console.log('=== CREATING RAZORPAY ORDER ===');
      console.log('Order data:', orderData);
      console.log('API URL:', `${this.apiBaseUrl}/payments/create-order`);
      
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('userToken') || 
                   localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('Token available:', !!token);

      const response = await fetch(`${this.apiBaseUrl}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Order creation failed - Response:', errorData);
        console.error('Full error details:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          body: orderData
        });
        throw new Error(errorData.error?.message || errorData.message || 'Failed to create order');
      }

      const data = await response.json();
      console.log('Order created successfully:', data);
      console.log('=== ORDER CREATION SUCCESS ===');
      return data.data;
    } catch (error) {
      console.error('=== ORDER CREATION FAILED ===');
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  /**
   * Verify payment with backend
   */
  async verifyPayment(paymentData: RazorpayPaymentData): Promise<any> {
    try {
      console.log('=== PAYMENT VERIFICATION START ===');
      console.log('Payment data being sent:', paymentData);
      console.log('Amount type:', typeof paymentData.amount, 'Value:', paymentData.amount);
      console.log('Payment method:', paymentData.paymentMethod);
      console.log('Currency:', paymentData.currency);
      console.log('Booking ID:', paymentData.bookingId);
      
      const token = localStorage.getItem('token') || 
                   localStorage.getItem('userToken') || 
                   localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('Token details:', {
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + '...',
        tokenEnd: '...' + token.substring(token.length - 20),
        tokenType: typeof token
      });

      const requestBody = {
        razorpayOrderId: paymentData.razorpayOrderId,
        razorpayPaymentId: paymentData.razorpayPaymentId,
        razorpaySignature: paymentData.razorpaySignature,
        bookingId: paymentData.bookingId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        currency: paymentData.currency
      };

      console.log('Request body being sent:', requestBody);
      console.log('API URL:', `${this.apiBaseUrl}/payments/verify`);
      console.log('Token available:', !!token);
      console.log('Authorization header:', `Bearer ${token.substring(0, 20)}...`);

      const response = await fetch(`${this.apiBaseUrl}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Payment verification response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment verification failed - Response:', errorData);
        console.error('Full error details:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          body: requestBody,
          errorData: errorData
        });
        
        // Log detailed error information
        if (response.status === 500) {
          console.error('=== 500 INTERNAL SERVER ERROR DETAILS ===');
          console.error('Error message:', errorData.error?.message || errorData.message);
          console.error('Error details:', errorData.error?.details);
          console.error('Full error object:', errorData);
        }
        
        throw new Error(errorData.error?.message || errorData.message || 'Payment verification failed');
      }

      const data = await response.json();
      console.log('Payment verification successful:', data);
      console.log('=== PAYMENT VERIFICATION SUCCESS ===');
      return data.data;
    } catch (error) {
      console.error('=== PAYMENT VERIFICATION FAILED ===');
      console.error('Payment verification failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Razorpay payment
   */
  async initializePayment(
    orderData: RazorpayOrderData,
    userData: { name: string; email: string; phone: string },
    onSuccess: (response: any, order: any) => void, // Add order parameter
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
        handler: (response) => onSuccess(response, order), // Pass order to handler
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
    onSuccess: (response: any, order: any) => void, // Add order parameter
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
        async (response, order) => { // Add order parameter
          try {
            // Verify payment
            // Razorpay response structure: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
            const paymentData: RazorpayPaymentData = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingId: bookingData.bookingId,
              // Use the order amount which is already in paise from Razorpay
              amount: order.amount, // This is already in paise from the order
              paymentMethod: 'razorpay',
              currency: 'INR'
            };

            console.log('=== PAYMENT VERIFICATION DATA ===');
            console.log('Payment data:', paymentData);
            console.log('Razorpay response:', response);
            console.log('Order data:', order);
            console.log('Booking data:', bookingData);
            console.log('Amount breakdown:', {
              orderAmountInPaise: order.amount,
              orderAmountInRupees: order.amount / 100,
              bookingAmount: bookingData.amount,
              finalAmount: paymentData.amount,
              finalAmountInRupees: paymentData.amount / 100
            });
            
            const verificationResult = await this.verifyPayment(paymentData);
            
            toast({
              title: "Payment Successful!",
              description: "Your booking has been confirmed.",
            });

            onSuccess(verificationResult, orderData); // Pass both response and order data
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
    onSuccess: (response: any, order: any) => void, // Add order parameter
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
        async (response, order) => { // Add order parameter
          try {
            // Verify payment
            const paymentData: RazorpayPaymentData = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              // Use the order amount which is already in paise
              amount: order.amount,
              paymentMethod: 'razorpay',
              currency: 'INR'
            };

            const verificationResult = await this.verifyPayment(paymentData);
            
            toast({
              title: "Recharge Successful!",
              description: `₹${amount} has been added to your wallet.`,
            });

            onSuccess(verificationResult, orderData); // Pass both response and order data
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
