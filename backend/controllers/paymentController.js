const Payment = require('../models/Payment');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const { sendEmail, sendPaymentConfirmationSMS } = require('../utils/notifications');
const asyncHandler = require('../middleware/asyncHandler');
const RazorpayService = require('../services/razorpayService');

// @desc    Test payment endpoint
// @route   GET /api/payments/test
// @access  Public
const testPaymentEndpoint = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Payment controller is working!',
    timestamp: new Date().toISOString(),
    data: {
      status: 'active',
      version: '1.0.0'
    }
  });
});

// @desc    Test Razorpay configuration
// @route   GET /api/payments/test-config
// @access  Private (User)
const testRazorpayConfig = asyncHandler(async (req, res) => {
  try {
    console.log('=== TESTING RAZORPAY CONFIGURATION ===');
    
    // Check environment variables
    const envCheck = {
      RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      NODE_ENV: process.env.NODE_ENV || 'development'
    };
    
    console.log('Environment variables check:', envCheck);
    
    // Check RazorpayService configuration
    const serviceConfigured = RazorpayService.isConfigured();
    console.log('RazorpayService configured:', serviceConfigured);
    
    // Test Razorpay connectivity
    let connectivityTest = { success: false, error: null };
    if (serviceConfigured) {
      try {
        // Try to create a minimal test order
        const testOrder = await RazorpayService.createOrder({
          amount: 100, // 1 INR in paise
          currency: 'INR',
          receipt: `test_${Date.now()}`,
          notes: { test: true }
        });
        connectivityTest = { success: true, orderId: testOrder.orderId };
        console.log('Connectivity test successful:', testOrder.orderId);
      } catch (error) {
        connectivityTest = { success: false, error: error.message };
        console.error('Connectivity test failed:', error.message);
      }
    }
    
    const config = {
      environment: envCheck.NODE_ENV,
      environmentVariables: envCheck,
      serviceConfigured,
      connectivityTest,
      timestamp: new Date().toISOString()
    };
    
    console.log('Configuration test result:', config);
    
    res.json({
      success: true,
      message: 'Razorpay configuration check completed',
      data: config
    });
  } catch (error) {
    console.error('Configuration check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Configuration check failed',
      error: error.message
    });
  }
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private (User)
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', receipt, notes } = req.body;

  try {
    const orderData = {
      amount,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        ...notes,
        userId: req.user.id,
        userEmail: req.user.email,
        timestamp: new Date().toISOString(),
      },
    };

    const order = await RazorpayService.createOrder(orderData);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
});

// @desc    Verify and process Razorpay payment
// @route   POST /api/payments/verify
// @access  Private (User)
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  try {
    console.log('=== PAYMENT VERIFICATION START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user.id);
    console.log('Headers:', req.headers);
    
    // Debug the amount specifically
    console.log('=== AMOUNT DEBUG ===');
    console.log('Raw amount from request:', req.body.amount);
    console.log('Amount type:', typeof req.body.amount);
    console.log('Amount parsed as number:', Number(req.body.amount));
    console.log('Amount validation:', {
      original: req.body.amount,
      parsed: Number(req.body.amount),
      isNaN: isNaN(Number(req.body.amount)),
      isFinite: Number.isFinite(Number(req.body.amount))
    });
    
    // Check if Razorpay environment variables are set
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay environment variables not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment service not configured',
        error: {
          message: 'Razorpay configuration missing',
          statusCode: 500,
          details: 'Please check server configuration'
        }
      });
    }
    
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      bookingId,
      amount,
      paymentMethod,
      currency = 'INR'
    } = req.body;

    // Validate required fields
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      console.error('Missing required fields:', { razorpayOrderId, razorpayPaymentId, razorpaySignature });
      return res.status(400).json({
        success: false,
        message: 'Missing required payment fields',
        error: {
          message: 'Missing required payment fields',
          statusCode: 400,
          details: {
            razorpayOrderId: !razorpayOrderId,
            razorpayPaymentId: !razorpayPaymentId,
            razorpaySignature: !razorpaySignature
          }
        }
      });
    }

    if (!amount || isNaN(amount)) {
      console.error('Invalid amount:', amount);
      return res.status(400).json({
        success: false,
        message: 'Invalid amount provided',
        error: {
          message: 'Invalid amount provided',
          statusCode: 400,
          details: { amount: amount }
        }
      });
    }

    console.log('Payment verification request:', {
      razorpayOrderId,
      razorpayPaymentId,
      amount,
      paymentMethod,
      currency,
      userId: req.user.id
    });

    // Verify payment signature
    console.log('Verifying payment signature...');
    try {
      const isSignatureValid = RazorpayService.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!isSignatureValid) {
        console.error('Payment signature verification failed');
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature',
          error: {
            message: 'Invalid payment signature',
            statusCode: 400,
            details: 'Signature verification failed'
          }
        });
      }
      console.log('Payment signature verified successfully');
    } catch (signatureError) {
      console.error('Signature verification error:', signatureError);
      return res.status(500).json({
        success: false,
        message: 'Signature verification failed',
        error: {
          message: 'Signature verification error',
          statusCode: 500,
          details: signatureError.message
        }
      });
    }

    // Get payment details from Razorpay
    console.log('Fetching payment details from Razorpay...');
    let paymentDetails;
    try {
      paymentDetails = await RazorpayService.getPaymentDetails(razorpayPaymentId);
      console.log('Razorpay payment details:', paymentDetails);
    } catch (razorpayError) {
      console.error('Failed to fetch Razorpay payment details:', razorpayError);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details',
        error: {
          message: 'Razorpay API error',
          statusCode: 500,
          details: razorpayError.message
        }
      });
    }

    if (!paymentDetails || !paymentDetails.status) {
      console.error('Invalid payment details from Razorpay');
      return res.status(400).json({
        success: false,
        message: 'Invalid payment details from Razorpay',
        error: {
          message: 'Invalid payment details',
          statusCode: 400,
          details: 'No status found in payment details'
        }
      });
    }

    if (paymentDetails.status !== 'captured') {
      console.error('Payment not captured, status:', paymentDetails.status);
      return res.status(400).json({
        success: false,
        message: 'Payment not captured',
        error: {
          message: 'Payment not captured',
          statusCode: 400,
          details: { status: paymentDetails.status }
        }
      });
    }
    console.log('Payment captured successfully');

    // Handle amount conversion - Razorpay sends amount in paise
    // Razorpay always sends amount in paise (1 INR = 100 paise)
    console.log('=== AMOUNT CONVERSION DEBUG ===');
    console.log('Original amount received:', amount);
    console.log('Amount type:', typeof amount);
    console.log('Amount validation:', {
      isNumber: typeof amount === 'number',
      isFinite: Number.isFinite(amount),
      isInteger: Number.isInteger(amount),
      isPositive: amount > 0
    });
    
    let amountInRupees = amount;
    if (amount >= 100) {
      amountInRupees = Math.round(amount / 100); // Convert paise to rupees and round
      console.log('Amount converted from paise to rupees:', { 
        original: amount, 
        converted: amountInRupees,
        expectedInPaise: amount,
        expectedInRupees: amount / 100,
        conversion: `${amount} paise ÷ 100 = ${amount / 100} rupees`
      });
    } else {
      // If amount is less than 100, it's already in rupees (edge case)
      amountInRupees = Math.round(amount); // Round to whole rupees
      console.log('Amount already in rupees, rounded:', { 
        original: amount, 
        converted: amountInRupees,
        note: 'Amount less than 100, treating as rupees',
        warning: 'This might indicate an error in amount conversion'
      });
    }

    // Validate that the converted amount makes sense
    if (amountInRupees <= 0 || amountInRupees > 100000) {
      console.error('Invalid converted amount:', { 
        original: amount, 
        converted: amountInRupees,
        message: 'Amount should be between ₹1 and ₹100,000'
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
        error: {
          message: 'Invalid amount',
          statusCode: 400,
          details: 'Amount should be between ₹1 and ₹100,000'
        }
      });
    }

    // Create payment record in database
    console.log('Creating payment record in database...');
    
    // Prepare payment data - determine payment type based on booking ID
    const isTemporaryBooking = bookingId && bookingId.startsWith('temp_');
    const paymentType = isTemporaryBooking ? 'booking' : (bookingId ? 'booking' : 'wallet_recharge');
    
    const paymentData = {
      user: req.user.id,
      amount: amountInRupees,
      currency,
      method: paymentMethod || 'razorpay',
      status: 'completed',
      type: paymentType,
      transactionId: razorpayPaymentId,
      paymentGateway: 'razorpay',
      paymentDetails: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        gatewayResponse: paymentDetails,
        method: paymentDetails.method,
        bank: paymentDetails.bank,
        card: paymentDetails.card,
        upi: paymentDetails.upi,
        wallet: paymentDetails.wallet,
        vpa: paymentDetails.vpa,
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceType: 'web'
      }
    };
    
    // For temporary bookings, store the temporary ID for later linking
    if (isTemporaryBooking) {
      paymentData.temporaryBookingId = bookingId;
    } else if (bookingId) {
      paymentData.booking = bookingId;
    }
    
    console.log('Payment data to save:', paymentData);
    
    const payment = await Payment.create(paymentData);

    console.log('Payment record created:', payment._id);

    // For temporary bookings, we can't update the booking yet
    // The frontend will create the actual booking after payment success
    if (isTemporaryBooking) {
      console.log('Temporary booking ID detected. Payment stored for later linking.');
    } else if (bookingId) {
      // Update existing booking payment status
      console.log('Updating existing booking payment status...');
      try {
        const booking = await Booking.findById(bookingId);
        if (booking) {
          if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({
              success: false,
              message: 'Not authorized to pay for this booking',
              error: {
                message: 'Not authorized to pay for this booking',
                statusCode: 403,
                details: 'User ID mismatch'
              }
            });
          }

          if (booking.payment && booking.payment.status === 'completed') {
            return res.status(400).json({
              success: false,
              message: 'Payment already completed',
              error: {
                message: 'Payment already completed',
                statusCode: 400,
                details: 'Booking already paid'
              }
            });
          }

          // Update booking payment status
          if (!booking.payment) {
            booking.payment = {};
          }
          booking.payment.status = 'completed';
          booking.payment.transactionId = razorpayPaymentId;
          booking.payment.completedAt = new Date();
          booking.payment.method = paymentMethod || 'razorpay';
          booking.payment.amount = amountInRupees;
          await booking.save();

          console.log('Booking payment status updated:', booking._id);

          // Send payment confirmation notifications
          try {
            await Promise.all([
              sendPaymentConfirmationSMS(req.user.phone, booking.bookingNumber, amountInRupees),
              req.user.email && sendEmail(
                req.user.email,
                'Payment Confirmation',
                `Your payment of ₹${amountInRupees} for booking ${booking.bookingNumber} has been confirmed.`
              )
            ]);
          } catch (notificationError) {
            console.error('Notification sending failed:', notificationError);
          }
        } else {
          console.log('No booking found for ID:', bookingId);
        }
      } catch (bookingError) {
        console.error('Error updating booking:', bookingError);
        // Don't fail the payment if booking update fails
      }
    }

    console.log('=== PAYMENT VERIFICATION SUCCESS ===');
    
    const responseData = {
      paymentId: payment._id,
      transactionId: razorpayPaymentId,
      status: 'completed',
      amount: amountInRupees,
      paymentMethod: paymentMethod || 'razorpay'
    };
    
    // Add booking info if it's a real booking
    if (bookingId && !bookingId.startsWith('temp_')) {
      responseData.bookingId = bookingId;
    } else if (bookingId && bookingId.startsWith('temp_')) {
      responseData.temporaryBookingId = bookingId;
      responseData.message = 'Payment successful for temporary booking. Please complete your booking process.';
    }
    
    res.json({
      success: true,
      message: 'Payment verified and processed successfully',
      data: responseData
    });
  } catch (error) {
    console.error('=== PAYMENT VERIFICATION FAILED ===');
    console.error('Payment verification failed:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
});

// @desc    Process payment (legacy method - kept for backward compatibility)
// @route   POST /api/payments/process
// @access  Private (User)
const processPayment = asyncHandler(async (req, res) => {
  const {
    bookingId,
    paymentMethod,
    amount,
    currency = 'INR',
    paymentDetails
  } = req.body;

  // Validate booking
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to pay for this booking'
    });
  }

  if (booking.payment.status === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Payment already completed'
    });
  }

  // Validate amount
  if (Math.abs(amount - booking.pricing.totalAmount) > 0.01) {
    return res.status(400).json({
      success: false,
      message: 'Amount mismatch'
    });
  }

  let paymentResult;

  try {
    switch (paymentMethod) {
      case 'wallet':
        paymentResult = await processWalletPayment(req.user.id, amount, bookingId);
        break;
      
      case 'card':
        paymentResult = await processCardPayment(amount, currency, paymentDetails, bookingId);
        break;
      
      case 'upi':
        paymentResult = await processUPIPayment(amount, currency, paymentDetails, bookingId);
        break;
      
      case 'cash':
        paymentResult = await processCashPayment(amount, bookingId);
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method'
        });
    }

    // Update booking payment status
    booking.payment.status = 'completed';
    booking.payment.transactionId = paymentResult.transactionId;
    booking.payment.completedAt = new Date();
    await booking.save();

    // Send payment confirmation
    await Promise.all([
      sendPaymentConfirmationSMS(req.user.phone, booking.bookingNumber, amount),
      sendEmail(
        req.user.email,
        'Payment Confirmation',
        `Your payment of ₹${amount} for booking ${booking.bookingNumber} has been confirmed.`
      )
    ]);

    res.json({
      success: true,
      data: {
        paymentId: paymentResult.paymentId,
        transactionId: paymentResult.transactionId,
        status: 'completed',
        amount,
        bookingId
      }
    });

  } catch (error) {
    // Log payment failure
    await Payment.create({
      user: req.user.id,
      booking: bookingId,
      amount,
      currency,
      method: paymentMethod,
      status: 'failed',
      error: error.message,
      paymentDetails
    });

    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
});

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private (User)
const getPaymentHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { user: req.user.id };
  if (status) query.status = status;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: 'booking'
  };

  const payments = await Payment.paginate(query, options);

  res.json({
    success: true,
    data: payments
  });
});

// @desc    Get payment by ID
// @route   GET /api/payments/:id
// @access  Private (User)
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('booking')
    .populate('user', 'firstName lastName email');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.user._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this payment'
    });
  }

  res.json({
    success: true,
    data: payment
  });
});

// @desc    Refund payment
// @route   POST /api/payments/:id/refund
// @access  Private (User)
const refundPayment = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to refund this payment'
    });
  }

  if (payment.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Payment not completed'
    });
  }

  // Check if refund is allowed (within time limit)
  const paymentTime = new Date(payment.createdAt);
  const now = new Date();
  const hoursDiff = (now - paymentTime) / (1000 * 60 * 60);

  if (hoursDiff > 24) {
    return res.status(400).json({
      success: false,
      message: 'Refund not allowed after 24 hours'
    });
  }

  let refundResult;

  try {
    switch (payment.method) {
      case 'wallet':
        refundResult = await refundWalletPayment(payment);
        break;
      
      case 'card':
        refundResult = await refundCardPayment(payment);
        break;
      
      case 'upi':
        refundResult = await refundUPIPayment(payment);
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Refund not supported for this payment method'
        });
    }

    // Update payment status
    payment.status = 'refunded';
    payment.refund = {
      amount: refundResult.amount,
      reason,
      refundedAt: new Date(),
      refundId: refundResult.refundId
    };
    await payment.save();

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        refundId: refundResult.refundId,
        amount: refundResult.amount,
        status: 'refunded'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Refund processing failed',
      error: error.message
    });
  }
});

// @desc    Add money to wallet
// @route   POST /api/payments/wallet/add
// @access  Private (User)
const addMoneyToWallet = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, paymentDetails } = req.body;

  if (amount < 100) {
    return res.status(400).json({
      success: false,
      message: 'Minimum amount to add is ₹100'
    });
  }

  if (amount > 10000) {
    return res.status(400).json({
      success: false,
      message: 'Maximum amount to add is ₹10,000'
    });
  }

  let paymentResult;

  try {
    switch (paymentMethod) {
      case 'card':
        paymentResult = await processCardPayment(amount, 'INR', paymentDetails, null, 'wallet');
        break;
      
      case 'upi':
        paymentResult = await processUPIPayment(amount, 'INR', paymentDetails, null, 'wallet');
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method for wallet recharge'
        });
    }

    // Add money to user wallet
    const user = await User.findById(req.user.id);
    user.wallet.balance += amount;
    user.wallet.transactions.push({
      type: 'credit',
      amount,
      description: 'Wallet recharge',
      timestamp: new Date(),
      transactionId: paymentResult.transactionId
    });
    await user.save();

    // Create payment record
    await Payment.create({
      user: req.user.id,
      amount,
      currency: 'INR',
      method: paymentMethod,
      status: 'completed',
      transactionId: paymentResult.transactionId,
      paymentDetails,
      type: 'wallet_recharge'
    });

    res.json({
      success: true,
      data: {
        amount,
        newBalance: user.wallet.balance,
        transactionId: paymentResult.transactionId
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Wallet recharge failed',
      error: error.message
    });
  }
});

// @desc    Get wallet balance
// @route   GET /api/payments/wallet/balance
// @access  Private (User)
const getWalletBalance = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('wallet');

  res.json({
    success: true,
    data: {
      balance: user.wallet.balance,
      currency: 'INR'
    }
  });
});

// @desc    Get wallet transactions
// @route   GET /api/payments/wallet/transactions
// @access  Private (User)
const getWalletTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;

  const user = await User.findById(req.user.id).select('wallet');
  
  let transactions = user.wallet.transactions;
  
  if (type) {
    transactions = transactions.filter(t => t.type === type);
  }

  // Paginate transactions
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedTransactions = transactions.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      transactions: paginatedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: transactions.length,
        pages: Math.ceil(transactions.length / parseInt(limit))
      }
    }
  });
});

// @desc    Get all payments (Admin)
// @route   GET /api/payments/admin/all
// @access  Private (Admin)
const getAllPayments = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentMethod, startDate, endDate } = req.query;
    
    const query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by payment method
    if (paymentMethod) {
      query.method = paymentMethod;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const payments = await Payment.find(query)
      .populate('user', 'firstName lastName email phone')
      .populate('booking', 'bookingNumber tripDetails')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Payment.countDocuments(query);
    
    // Calculate payment statistics
    const stats = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalPayments: total,
          hasNextPage: skip + payments.length < total,
          hasPrevPage: parseInt(page) > 1
        },
        statistics: stats[0] || {
          totalAmount: 0,
          totalPayments: 0,
          completedPayments: 0,
          failedPayments: 0
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// @desc    Get payment statistics (Admin)
// @route   GET /api/payments/admin/stats
// @access  Private (Admin)
const getPaymentStats = asyncHandler(async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }
    
    const stats = await Payment.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const methodStats = await Payment.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: '$method',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        dailyStats: stats,
        methodStats,
        period
      }
    });
  } catch (error) {
    console.error('Failed to fetch payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics',
      error: error.message
    });
  }
});

// @desc    Link payment to booking (for temporary bookings)
// @route   POST /api/payments/link-booking
// @access  Private (User)
const linkPaymentToBooking = asyncHandler(async (req, res) => {
  try {
    const { paymentId, bookingId } = req.body;

    if (!paymentId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and Booking ID are required'
      });
    }

    // Find the payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify payment belongs to user
    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this payment'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify booking belongs to user
    if (booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking'
      });
    }

    // Update payment with booking reference
    payment.booking = bookingId;
    payment.type = 'booking';
    delete payment.temporaryBookingId;
    await payment.save();

    // Update booking payment status
    if (!booking.payment) {
      booking.payment = {};
    }
    booking.payment.status = 'completed';
    booking.payment.transactionId = payment.transactionId;
    booking.payment.completedAt = new Date();
    booking.payment.method = payment.method;
    booking.payment.amount = payment.amount;
    await booking.save();

    console.log('Payment linked to booking successfully:', { paymentId, bookingId });

    res.json({
      success: true,
      message: 'Payment linked to booking successfully',
      data: {
        paymentId: payment._id,
        bookingId: booking._id,
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('Error linking payment to booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link payment to booking',
      error: error.message
    });
  }
});

// @desc    Update cash payment status (for driver to mark as collected)
// @route   PUT /api/payments/cash-collected
// @access  Private (Driver)
const updateCashPaymentStatus = asyncHandler(async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify driver is assigned to this booking
    if (booking.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Update booking payment status
    if (!booking.payment) {
      booking.payment = {};
    }
    booking.payment.status = 'completed';
    booking.payment.completedAt = new Date();
    booking.payment.method = 'cash';
    await booking.save();

    // Create payment record for cash collection
    const payment = await Payment.create({
      user: booking.user,
      booking: bookingId,
      amount: booking.pricing.totalAmount,
      currency: 'INR',
      method: 'cash',
      status: 'completed',
      type: 'booking',
      paymentGateway: 'internal',
      metadata: {
        collectedBy: req.user.id,
        collectedAt: new Date(),
        deviceType: 'driver_app'
      }
    });

    console.log('Cash payment marked as collected:', { bookingId, paymentId: payment._id });

    res.json({
      success: true,
      message: 'Cash payment marked as collected',
      data: {
        paymentId: payment._id,
        bookingId: booking._id,
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('Error updating cash payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cash payment status',
      error: error.message
    });
  }
});

// Payment processing functions
async function processWalletPayment(userId, amount, bookingId) {
  const user = await User.findById(userId);
  
  if (user.wallet.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }

  // Deduct from wallet
  user.wallet.balance -= amount;
  user.wallet.transactions.push({
    type: 'debit',
    amount,
    description: `Booking payment`,
    timestamp: new Date()
  });
  await user.save();

  return {
    paymentId: `WALLET_${Date.now()}`,
    transactionId: `WALLET_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'completed'
  };
}

async function processCardPayment(amount, currency, paymentDetails, bookingId, type = 'booking') {
  // In a real app, integrate with Stripe or other payment gateway
  // For now, simulate successful payment
  
  if (!paymentDetails.cardNumber || !paymentDetails.expiryMonth || !paymentDetails.expiryYear || !paymentDetails.cvv) {
    throw new Error('Invalid card details');
  }

  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    paymentId: `CARD_${Date.now()}`,
    transactionId: `CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'completed'
  };
}

async function processUPIPayment(amount, currency, paymentDetails, bookingId, type = 'booking') {
  // In a real app, integrate with Razorpay or other UPI gateway
  // For now, simulate successful payment
  
  if (!paymentDetails.upiId) {
    throw new Error('Invalid UPI ID');
  }

  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    paymentId: `UPI_${Date.now()}`,
    transactionId: `UPI_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'completed'
  };
}

async function processCashPayment(amount, bookingId) {
  // Cash payments are marked as pending until driver confirms
  return {
    paymentId: `CASH_${Date.now()}`,
    transactionId: `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending'
  };
}

// @desc    Process partial payment for bus/car vehicles with cash method
// @route   POST /api/payments/process-partial-payment
// @access  Private (User)
const processPartialPayment = asyncHandler(async (req, res) => {
  const { bookingId, onlineAmount, totalAmount } = req.body;

  try {
    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify this is a partial payment booking
    if (!booking.payment.isPartialPayment) {
      return res.status(400).json({
        success: false,
        message: 'This booking does not support partial payment'
      });
    }

    // Verify the online amount matches the expected 30%
    const expectedOnlineAmount = Math.round(totalAmount * 0.3);
    if (onlineAmount !== expectedOnlineAmount) {
      return res.status(400).json({
        success: false,
        message: `Online payment amount must be ₹${expectedOnlineAmount} (30% of total)`
      });
    }

    // Create payment record for online portion
    const payment = new Payment({
      user: booking.user,
      booking: bookingId,
      amount: onlineAmount,
      method: 'razorpay',
      type: 'partial_booking',
      isPartialPayment: true,
      partialPaymentType: 'online_portion',
      totalBookingAmount: totalAmount,
      remainingAmount: totalAmount - onlineAmount,
      status: 'completed'
    });

    await payment.save();

    // Update booking payment status
    booking.payment.partialPaymentDetails.onlinePaymentStatus = 'completed';
    booking.payment.partialPaymentDetails.onlinePaymentId = payment._id;
    await booking.save();

    res.json({
      success: true,
      message: 'Partial payment processed successfully',
      data: {
        paymentId: payment._id,
        onlineAmount,
        remainingAmount: totalAmount - onlineAmount,
        totalAmount
      }
    });

  } catch (error) {
    console.error('Error processing partial payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process partial payment',
      error: error.message
    });
  }
});

// Refund processing functions
async function refundWalletPayment(payment) {
  const user = await User.findById(payment.user);
  user.wallet.balance += payment.amount;
  user.wallet.transactions.push({
    type: 'credit',
    amount: payment.amount,
    description: 'Payment refund',
    timestamp: new Date()
  });
  await user.save();

  return {
    refundId: `REFUND_${Date.now()}`,
    amount: payment.amount
  };
}

async function refundCardPayment(payment) {
  // In a real app, process refund through payment gateway
  // For now, simulate successful refund
  
  return {
    refundId: `REFUND_${Date.now()}`,
    amount: payment.amount
  };
}

async function refundUPIPayment(payment) {
  // In a real app, process refund through UPI gateway
  // For now, simulate successful refund
  
  return {
    refundId: `REFUND_${Date.now()}`,
    amount: payment.amount
  };
}

module.exports = {
  testPaymentEndpoint,
  testRazorpayConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
  processPayment,
  getPaymentHistory,
  getPaymentById,
  refundPayment,
  addMoneyToWallet,
  getWalletBalance,
  getWalletTransactions,
  getAllPayments,
  getPaymentStats,
  linkPaymentToBooking,
  updateCashPaymentStatus,
  processPartialPayment
};
