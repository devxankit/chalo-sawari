const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.Mixed, // Accept both ObjectId and string (for temporary IDs)
    ref: 'Booking',
    required: false // Optional for wallet recharges
  },
  temporaryBookingId: {
    type: String, // For storing temporary booking IDs until actual booking is created
    required: false
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  method: {
    type: String,
    required: true,
    enum: ['wallet', 'card', 'upi', 'cash', 'netbanking', 'razorpay']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  type: {
    type: String,
    required: true,
    enum: ['booking', 'wallet_recharge', 'refund', 'withdrawal'],
    default: 'booking'
  },
  transactionId: {
    type: String,
    sparse: true
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'razorpay', 'paytm', 'internal'],
    default: 'razorpay'
  },
  paymentDetails: {
    // For card payments
    cardNumber: String,
    cardType: String,
    expiryMonth: String,
    expiryYear: String,
    cvv: String,
    
    // For UPI payments
    upiId: String,
    
    // For netbanking
    bankName: String,
    accountNumber: String,
    
    // For wallet
    walletType: String,
    
    // Razorpay specific fields
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    
    // Generic fields
    referenceId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed
  },
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  },
  refund: {
    amount: Number,
    reason: String,
    refundedAt: Date,
    refundId: String,
    gatewayRefundId: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    location: {
      country: String,
      city: String,
      coordinates: [Number] // [longitude, latitude]
    }
  },
  timestamps: {
    initiated: {
      type: Date,
      default: Date.now
    },
    processed: Date,
    completed: Date,
    failed: Date,
    refunded: Date
  }
}, {
  timestamps: true
});

// Indexes
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ booking: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ method: 1, status: 1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toFixed(2)}`;
});

// Virtual for payment age
paymentSchema.virtual('ageInHours').get(function() {
  const now = new Date();
  const created = this.createdAt;
  return Math.floor((now - created) / (1000 * 60 * 60));
});

// Methods
paymentSchema.methods.markAsCompleted = function(transactionId, gatewayResponse = {}) {
  this.status = 'completed';
  this.transactionId = transactionId;
  this.timestamps.completed = new Date();
  this.paymentDetails.gatewayResponse = gatewayResponse;
  return this.save();
};

paymentSchema.methods.markAsFailed = function(errorCode, errorMessage, errorDetails = {}) {
  this.status = 'failed';
  this.error = {
    code: errorCode,
    message: errorMessage,
    details: errorDetails
  };
  this.timestamps.failed = new Date();
  return this.save();
};

paymentSchema.methods.processRefund = function(amount, reason, refundId) {
  this.status = 'refunded';
  this.refund = {
    amount,
    reason,
    refundedAt: new Date(),
    refundId
  };
  this.timestamps.refunded = new Date();
  return this.save();
};

// Static methods
paymentSchema.statics.getPaymentStats = async function(userId, period = 'month') {
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

  const query = { user: userId, ...dateFilter };

  const stats = await this.aggregate([
    { $match: query },
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
        refundedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    successfulPayments: 0,
    failedPayments: 0,
    refundedPayments: 0
  };
};

paymentSchema.statics.getPaymentMethodsStats = async function(userId) {
  return await this.aggregate([
    { $match: { user: userId, status: 'completed' } },
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Pre-save middleware
paymentSchema.pre('save', function(next) {
  // Update timestamps based on status changes
  if (this.isModified('status')) {
    switch (this.status) {
      case 'processing':
        this.timestamps.processed = new Date();
        break;
      case 'completed':
        this.timestamps.completed = new Date();
        break;
      case 'failed':
        this.timestamps.failed = new Date();
        break;
      case 'refunded':
        this.timestamps.refunded = new Date();
        break;
    }
  }
  
  next();
});

// Pre-remove middleware
paymentSchema.pre('remove', async function(next) {
  // If this is a wallet payment, update user wallet
  if (this.type === 'wallet_recharge' && this.status === 'completed') {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.user, {
      $inc: { 'wallet.balance': -this.amount }
    });
  }
  
  next();
});

// Add pagination plugin
paymentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Payment', paymentSchema);
