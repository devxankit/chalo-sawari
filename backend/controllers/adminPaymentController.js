const Payment = require('../models/Payment');
const User = require('../models/User');
const Booking = require('../models/Booking');
const RazorpayService = require('../services/razorpayService');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all payments with pagination and filters
// @route   GET /api/admin/payments
// @access  Private (Admin)
const getAllPayments = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    status, 
    paymentMethod, 
    paymentGateway,
    startDate,
    endDate,
    search
  } = req.query;

  // Build query
  const query = {};
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (paymentMethod && paymentMethod !== 'all') {
    query.method = paymentMethod;
  }
  
  if (paymentGateway && paymentGateway !== 'all') {
    query.paymentGateway = paymentGateway;
  }
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (search) {
    query.$or = [
      { transactionId: { $regex: search, $options: 'i' } },
      { 'paymentDetails.razorpayPaymentId': { $regex: search, $options: 'i' } },
      { 'paymentDetails.razorpayOrderId': { $regex: search, $options: 'i' } }
    ];
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      { path: 'user', select: 'firstName lastName email phone' },
      { 
        path: 'booking', 
        select: 'bookingNumber tripDetails.pickup.address tripDetails.destination.address tripDetails.date tripDetails.time tripDetails.tripType',
        match: { _id: { $exists: true } } // Only populate if booking exists
      }
    ]
  };

  const payments = await Payment.paginate(query, options);

  res.json({
    success: true,
    data: payments
  });
});

// @desc    Get payment statistics
// @route   GET /api/admin/payments/stats
// @access  Private (Admin)
const getPaymentStats = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let dateFilter = {};
  const now = new Date();
  
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    dateFilter = { createdAt: { $gte: weekAgo } };
  } else if (period === 'month') {
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
    dateFilter = { createdAt: { $gte: monthAgo } };
  } else if (period === 'year') {
    const yearAgo = new Date(now.getFullYear(), 0, 1);
    dateFilter = { createdAt: { $gte: yearAgo } };
  }

  const stats = await Payment.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        refundedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
        },
        averageTransactionValue: { $avg: '$amount' }
      }
    }
  ]);

  // Get payment method distribution
  const methodStats = await Payment.aggregate([
    { $match: { ...dateFilter, status: 'completed' } },
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  // Get payment gateway distribution
  const gatewayStats = await Payment.aggregate([
    { $match: { ...dateFilter, status: 'completed' } },
    {
      $group: {
        _id: '$paymentGateway',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  const result = stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    successfulPayments: 0,
    failedPayments: 0,
    pendingPayments: 0,
    refundedPayments: 0,
    averageTransactionValue: 0
  };

  // Calculate success rate
  result.successRate = result.totalPayments > 0 
    ? (result.successfulPayments / result.totalPayments) * 100 
    : 0;

  res.json({
    success: true,
    data: {
      ...result,
      methodDistribution: methodStats,
      gatewayDistribution: gatewayStats
    }
  });
});

// @desc    Get payment by ID
// @route   GET /api/admin/payments/:id
// @access  Private (Admin)
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('user', 'firstName lastName email phone')
    .populate('booking', 'bookingNumber tripDetails.pickup.address tripDetails.destination.address tripDetails.date tripDetails.time tripDetails.tripType');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  res.json({
    success: true,
    data: payment
  });
});

// @desc    Process refund
// @route   POST /api/admin/payments/:id/refund
// @access  Private (Admin)
const processRefund = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Payment not completed'
    });
  }

  if (amount > payment.amount) {
    return res.status(400).json({
      success: false,
      message: 'Refund amount cannot exceed payment amount'
    });
  }

  try {
    let refundResult;
    
    if (payment.paymentGateway === 'razorpay' && payment.paymentDetails.razorpayPaymentId) {
      // Process refund through Razorpay
      refundResult = await RazorpayService.processRefund(
        payment.paymentDetails.razorpayPaymentId,
        amount,
        reason
      );
    } else {
      // For other payment methods, create internal refund
      refundResult = {
        refundId: `REFUND_${Date.now()}`,
        amount: amount * 100, // Convert to paise for consistency
        status: 'processed'
      };
    }

    // Update payment status
    payment.status = 'refunded';
    payment.refund = {
      amount,
      reason,
      refundedAt: new Date(),
      refundId: refundResult.refundId,
      gatewayRefundId: refundResult.refundId
    };
    await payment.save();

    // If this was a wallet payment, credit the user's wallet
    if (payment.type === 'wallet_recharge') {
      const user = await User.findById(payment.user);
      if (user && user.wallet) {
        user.wallet.balance += amount;
        user.wallet.transactions.push({
          type: 'credit',
          amount,
          description: 'Payment refund',
          timestamp: new Date(),
          transactionId: refundResult.refundId
        });
        await user.save();
      }
    }

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        refundId: refundResult.refundId,
        amount,
        status: 'refunded'
      }
    });

  } catch (error) {
    console.error('Refund processing failed:', error);
    res.status(500).json({
      success: false,
      message: 'Refund processing failed',
      error: error.message
    });
  }
});

// @desc    Get payment details from Razorpay
// @route   GET /api/admin/payments/:id/razorpay-details
// @access  Private (Admin)
const getRazorpayDetails = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }

  if (payment.paymentGateway !== 'razorpay') {
    return res.status(400).json({
      success: false,
      message: 'Payment is not from Razorpay'
    });
  }

  try {
    const razorpayPaymentId = payment.paymentDetails.razorpayPaymentId;
    const paymentDetails = await RazorpayService.getPaymentDetails(razorpayPaymentId);
    
    // Get refunds if any
    const refunds = await RazorpayService.getPaymentRefunds(razorpayPaymentId);

    res.json({
      success: true,
      data: {
        paymentDetails,
        refunds: refunds.refunds
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Razorpay details',
      error: error.message
    });
  }
});

// @desc    Export payments data
// @route   GET /api/admin/payments/export
// @access  Private (Admin)
const exportPayments = asyncHandler(async (req, res) => {
  const { startDate, endDate, status, paymentMethod } = req.query;
  
  const query = {};
  
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (paymentMethod && paymentMethod !== 'all') {
    query.method = paymentMethod;
  }

  const payments = await Payment.find(query)
    .populate('user', 'firstName lastName email phone')
    .populate('booking', 'bookingNumber')
    .sort({ createdAt: -1 });

  // Format data for export
  const exportData = payments.map(payment => ({
    PaymentID: payment._id,
    TransactionID: payment.transactionId,
    UserName: payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : 'N/A',
    UserEmail: payment.user ? payment.user.email : 'N/A',
    UserPhone: payment.user ? payment.user.phone : 'N/A',
    BookingNumber: payment.booking ? payment.booking.bookingNumber : 'N/A',
    Amount: payment.amount,
    Currency: payment.currency,
    PaymentMethod: payment.method,
    PaymentGateway: payment.paymentGateway,
    Status: payment.status,
    Type: payment.type,
    CreatedAt: payment.createdAt,
    CompletedAt: payment.timestamps?.completed || 'N/A',
    RazorpayOrderId: payment.paymentDetails?.razorpayOrderId || 'N/A',
    RazorpayPaymentId: payment.paymentDetails?.razorpayPaymentId || 'N/A'
  }));

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=payments-export.csv');
  
  // Convert to CSV
  const csvHeader = Object.keys(exportData[0] || {}).join(',');
  const csvRows = exportData.map(row => 
    Object.values(row).map(value => 
      typeof value === 'string' && value.includes(',') ? `"${value}"` : value
    ).join(',')
  );
  
  const csv = [csvHeader, ...csvRows].join('\n');
  res.send(csv);
});

module.exports = {
  getAllPayments,
  getPaymentStats,
  getPaymentById,
  processRefund,
  getRazorpayDetails,
  exportPayments
};
