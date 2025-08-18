const Payment = require('../models/Payment');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const { sendEmail, sendPaymentConfirmationSMS } = require('../utils/notifications');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Process payment
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
  processPayment,
  getPaymentHistory,
  getPaymentById,
  refundPayment,
  addMoneyToWallet,
  getWalletBalance,
  getWalletTransactions
};
