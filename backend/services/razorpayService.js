const Razorpay = require('razorpay');
const crypto = require('crypto');

// Check if Razorpay environment variables are set
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  // Silent check for production
}

// Initialize Razorpay instance
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} catch (error) {
  razorpay = null;
}

class RazorpayService {
  /**
   * Check if Razorpay is properly configured
   */
  static isConfigured() {
    return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && razorpay);
  }

  /**
   * Create a new order
   * @param {Object} orderData - Order data
   * @param {number} orderData.amount - Amount in paise (1 INR = 100 paise)
   * @param {string} orderData.currency - Currency code (default: INR)
   * @param {string} orderData.receipt - Receipt ID
   * @param {Object} orderData.notes - Additional notes
   * @returns {Promise<Object>} Razorpay order
   */
  static async createOrder(orderData) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Razorpay service not configured. Please check environment variables.');
      }

      const options = {
        amount: Math.round(orderData.amount * 100), // Convert to paise
        currency: orderData.currency || 'INR',
        receipt: orderData.receipt,
        notes: orderData.notes || {},
        payment_capture: 1, // Auto capture payment
      };

      const order = await razorpay.orders.create(options);
      
      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        createdAt: order.created_at,
      };
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  /**
   * Verify payment signature
   * @param {string} razorpayOrderId - Razorpay order ID
   * @param {string} razorpayPaymentId - Razorpay payment ID
   * @param {string} razorpaySignature - Razorpay signature
   * @returns {boolean} Signature verification result
   */
  static verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
    try {
      // Validate input parameters
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return false;
      }
      
      if (!process.env.RAZORPAY_KEY_SECRET) {
        return false;
      }
      
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      
      return expectedSignature === razorpaySignature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Capture payment
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Amount to capture in paise
   * @returns {Promise<Object>} Capture result
   */
  static async capturePayment(paymentId, amount) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Razorpay service not configured. Please check environment variables.');
      }

      const captureData = {
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
      };

      const payment = await razorpay.payments.capture(paymentId, captureData);
      return {
        success: true,
        paymentId: payment.id,
        status: payment.status,
        capturedAt: payment.captured_at,
        amount: payment.amount,
        currency: payment.currency,
      };
    } catch (error) {
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  /**
   * Get payment details
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Object>} Payment details
   */
  static async getPaymentDetails(paymentId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Razorpay service not configured. Please check environment variables.');
      }
      
      if (!paymentId) {
        throw new Error('Payment ID is required');
      }
      
      const payment = await razorpay.payments.fetch(paymentId);
      
      return {
        success: true,
        paymentId: payment.id,
        orderId: payment.order_id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        bank: payment.bank,
        card: payment.card,
        upi: payment.upi,
        wallet: payment.wallet,
        vpa: payment.vpa,
        email: payment.email,
        contact: payment.contact,
        name: payment.name,
        description: payment.description,
        notes: payment.notes,
        createdAt: payment.created_at,
        capturedAt: payment.captured_at,
      };
    } catch (error) {
      throw new Error(`Failed to fetch payment details: ${error.message}`);
    }
  }

  /**
   * Process refund
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Amount to refund in paise
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Refund result
   */
  static async processRefund(paymentId, amount, reason = 'Customer request') {
    try {
      if (!this.isConfigured()) {
        throw new Error('Razorpay service not configured. Please check environment variables.');
      }
      const refundData = {
        amount: Math.round(amount * 100), // Convert to paise
        speed: 'normal', // or 'optimum'
        notes: {
          reason: reason,
        },
      };

      const refund = await razorpay.payments.refund(paymentId, refundData);
      return {
        success: true,
        refundId: refund.id,
        paymentId: refund.payment_id,
        status: refund.status,
        amount: refund.amount,
        currency: refund.currency,
        speed: refund.speed,
        notes: refund.notes,
        createdAt: refund.created_at,
      };
    } catch (error) {
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Get refund details
   * @param {string} refundId - Razorpay refund ID
   * @returns {Promise<Object>} Refund details
   */
  static async getRefundDetails(refundId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Razorpay service not configured. Please check environment variables.');
      }
      const refund = await razorpay.refunds.fetch(refundId);
      return {
        success: true,
        refundId: refund.id,
        paymentId: refund.payment_id,
        status: refund.status,
        amount: refund.amount,
        currency: refund.currency,
        speed: refund.speed,
        notes: refund.notes,
        createdAt: refund.created_at,
        processedAt: refund.processed_at,
      };
    } catch (error) {
      throw new Error(`Failed to fetch refund details: ${error.message}`);
    }
  }

  /**
   * Get all refunds for a payment
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<Array>} Array of refunds
   */
  static async getPaymentRefunds(paymentId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Razorpay service not configured. Please check environment variables.');
      }
      const refunds = await razorpay.payments.fetchAllRefunds(paymentId);
      return {
        success: true,
        refunds: refunds.items.map(refund => ({
          refundId: refund.id,
          paymentId: refund.payment_id,
          status: refund.status,
          amount: refund.amount,
          currency: refund.currency,
          speed: refund.speed,
          notes: refund.notes,
          createdAt: refund.created_at,
          processedAt: refund.processed_at,
        })),
        count: refunds.count,
      };
    } catch (error) {
      throw new Error(`Failed to fetch payment refunds: ${error.message}`);
    }
  }

  /**
   * Get payment methods
   * @returns {Object} Available payment methods
   */
  static getPaymentMethods() {
    return {
      upi: {
        name: 'UPI',
        description: 'Pay using UPI ID',
        icon: '📱',
        supported: true,
      },
      card: {
        name: 'Credit/Debit Card',
        description: 'Pay using credit or debit card',
        icon: '💳',
        supported: true,
      },
      netbanking: {
        name: 'Net Banking',
        description: 'Pay using net banking',
        icon: '🏦',
        supported: true,
      },
      wallet: {
        name: 'Digital Wallet',
        description: 'Pay using digital wallets',
        icon: '👛',
        supported: true,
      },
      emi: {
        name: 'EMI',
        description: 'Pay in easy installments',
        icon: '📅',
        supported: true,
      },
    };
  }
}

module.exports = RazorpayService;
