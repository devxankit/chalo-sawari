const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: [true, 'Driver is required']
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required']
  },
  bookingNumber: {
    type: String,
    required: true
  },
  tripType: {
    type: String,
    enum: ['one_way', 'round_trip', 'multi_city'],
    default: 'one_way'
  },
  pickup: {
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: [true, 'Pickup coordinates are required']
      },
      address: {
        type: String,
        required: [true, 'Pickup address is required']
      },
      city: {
        type: String,
        required: [true, 'Pickup city is required']
      },
      state: {
        type: String,
        required: [true, 'Pickup state is required']
      },
      pincode: String
    },
    date: {
      type: Date,
      required: [true, 'Pickup date is required']
    },
    time: {
      type: String,
      required: [true, 'Pickup time is required']
    },
    instructions: String
  },
  destination: {
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: [true, 'Destination coordinates are required']
      },
      address: {
        type: String,
        required: [true, 'Destination address is required']
      },
      city: {
        type: String,
        required: [true, 'Destination city is required']
      },
      state: {
        type: String,
        required: [true, 'Destination state is required']
      },
      pincode: String
    },
    date: Date, // For round trips
    time: String, // For round trips
    instructions: String
  },
  passengers: [{
    name: {
      type: String,
      required: [true, 'Passenger name is required']
    },
    age: {
      type: Number,
      required: [true, 'Passenger age is required'],
      min: [0, 'Age cannot be negative']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Passenger gender is required']
    },
    seatNumber: String,
    isChild: {
      type: Boolean,
      default: false
    },
    isWheelchair: {
      type: Boolean,
      default: false
    }
  }],
  pricing: {
    baseFare: {
      type: Number,
      required: [true, 'Base fare is required']
    },
    distance: {
      type: Number,
      required: [true, 'Distance is required']
    },
    perKmRate: {
      type: Number,
      required: [true, 'Per km rate is required']
    },
    additionalCharges: {
      ac: {
        type: Number,
        default: 0
      },
      night: {
        type: Number,
        default: 0
      },
      waiting: {
        type: Number,
        default: 0
      },
      surge: {
        type: Number,
        default: 0
      },
      toll: {
        type: Number,
        default: 0
      },
      parking: {
        type: Number,
        default: 0
      }
    },
    subtotal: {
      type: Number,
      required: [true, 'Subtotal is required']
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: [true, 'Total amount is required']
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'card', 'upi', 'wallet', 'net_banking'],
      required: [true, 'Payment method is required']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String,
    gateway: {
      type: String,
      enum: ['stripe', 'razorpay', 'paytm', 'phonepe'],
      default: 'stripe'
    },
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'driver_assigned', 'driver_en_route', 'driver_arrived', 'trip_started', 'trip_completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  cancellation: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancelledBy: {
      type: String,
      enum: ['user', 'driver', 'system', 'admin'],
      default: null
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: Number,
    cancellationFee: Number
  },
  trip: {
    startTime: Date,
    endTime: Date,
    actualDistance: Number,
    actualDuration: Number,
    route: [{
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: [Number],
        address: String,
        timestamp: Date
      }
    }],
    stops: [{
      location: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: [Number],
        address: String
      },
      duration: Number, // minutes
      reason: String
    }]
  },
  rating: {
    userRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      ratedAt: Date
    },
    driverRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      ratedAt: Date
    }
  },
  communication: {
    messages: [{
      sender: {
        type: String,
        enum: ['user', 'driver', 'system'],
        required: true
      },
      message: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      isRead: {
        type: Boolean,
        default: false
      }
    }],
    calls: [{
      initiatedBy: {
        type: String,
        enum: ['user', 'driver'],
        required: true
      },
      duration: Number, // seconds
      timestamp: Date
    }]
  },
  specialRequests: [{
    type: String,
    enum: ['wheelchair', 'child_seat', 'extra_luggage', 'pet_friendly', 'smoking', 'non_smoking', 'music', 'quiet_ride']
  }],
  notes: String,
  estimatedDuration: Number, // minutes
  estimatedDistance: Number, // km
  isUrgent: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for trip duration
BookingSchema.virtual('tripDuration').get(function() {
  if (this.trip.startTime && this.trip.endTime) {
    return Math.round((this.trip.endTime - this.trip.startTime) / (1000 * 60)); // minutes
  }
  return null;
});

// Virtual for is active
BookingSchema.virtual('isActive').get(function() {
  const activeStatuses = ['pending', 'confirmed', 'driver_assigned', 'driver_en_route', 'driver_arrived', 'trip_started'];
  return activeStatuses.includes(this.status);
});

// Virtual for can be cancelled
BookingSchema.virtual('canBeCancelled').get(function() {
  const cancellableStatuses = ['pending', 'confirmed', 'driver_assigned'];
  return cancellableStatuses.includes(this.status);
});

// Virtual for total passengers
BookingSchema.virtual('totalPassengers').get(function() {
  return this.passengers.length;
});

// Virtual for adults count
BookingSchema.virtual('adultsCount').get(function() {
  return this.passengers.filter(p => !p.isChild).length;
});

// Virtual for children count
BookingSchema.virtual('childrenCount').get(function() {
  return this.passengers.filter(p => p.isChild).length;
});

// Index for better query performance
BookingSchema.index({ user: 1, status: 1 });
BookingSchema.index({ driver: 1, status: 1 });
BookingSchema.index({ vehicle: 1, status: 1 });
BookingSchema.index({ bookingNumber: 1 });
BookingSchema.index({ 'pickup.date': 1, status: 1 });
BookingSchema.index({ 'pickup.location.coordinates': '2dsphere' });
BookingSchema.index({ 'destination.location.coordinates': '2dsphere' });
BookingSchema.index({ createdAt: 1, status: 1 });

// Pre-save middleware to generate booking number
BookingSchema.pre('save', function(next) {
  if (this.isNew && !this.bookingNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingNumber = `CS${timestamp}${random}`;
  }
  next();
});

// Method to calculate total amount
BookingSchema.methods.calculateTotal = function() {
  // For now, just return the totalAmount if it exists, otherwise calculate from baseFare
  if (this.pricing.totalAmount) {
    return this.pricing.totalAmount;
  }
  
  // Fallback to baseFare if totalAmount is not available
  const subtotal = this.pricing.baseFare || 0;
  this.pricing.subtotal = subtotal;
  this.pricing.total = subtotal;
  
  return this.pricing.total;
};

// Method to update trip status
BookingSchema.methods.updateStatus = function(newStatus, reason = null) {
  const validTransitions = {
    pending: ['confirmed', 'cancelled', 'expired'],
    confirmed: ['driver_assigned', 'cancelled'],
    driver_assigned: ['driver_en_route', 'cancelled'],
    driver_en_route: ['driver_arrived', 'cancelled'],
    driver_arrived: ['trip_started', 'cancelled'],
    trip_started: ['trip_completed', 'cancelled'],
    trip_completed: [],
    cancelled: [],
    expired: []
  };

  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;
  
  if (newStatus === 'trip_started') {
    this.trip.startTime = new Date();
  } else if (newStatus === 'trip_completed') {
    this.trip.endTime = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancellation.isCancelled = true;
    this.cancellation.cancelledAt = new Date();
    if (reason) this.cancellation.reason = reason;
  }

  return this.save();
};

// Method to add message
BookingSchema.methods.addMessage = function(sender, message) {
  this.communication.messages.push({
    sender,
    message,
    timestamp: new Date()
  });
  return this.save();
};

// Method to mark messages as read
BookingSchema.methods.markMessagesAsRead = function(userType) {
  this.communication.messages.forEach(msg => {
    if (msg.sender !== userType) {
      msg.isRead = true;
    }
  });
  return this.save();
};

// Method to calculate cancellation fee
BookingSchema.methods.calculateCancellationFee = function() {
  const now = new Date();
  const pickupTime = new Date(this.pickup.date + 'T' + this.pickup.time);
  const hoursUntilPickup = (pickupTime - now) / (1000 * 60 * 60);

  let cancellationFee = 0;
  
  if (hoursUntilPickup > 24) {
    cancellationFee = this.pricing.total * 0.05; // 5% if cancelled more than 24 hours before
  } else if (hoursUntilPickup > 2) {
    cancellationFee = this.pricing.total * 0.15; // 15% if cancelled 2-24 hours before
  } else if (hoursUntilPickup > 0) {
    cancellationFee = this.pricing.total * 0.25; // 25% if cancelled less than 2 hours before
  } else {
    cancellationFee = this.pricing.total * 0.50; // 50% if cancelled after pickup time
  }

  this.cancellation.cancellationFee = Math.round(cancellationFee);
  this.cancellation.refundAmount = this.pricing.total - this.cancellation.cancellationFee;
  
  return this.cancellation.cancellationFee;
};

// Method to add rating
BookingSchema.methods.addRating = function(userType, rating, comment) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  if (userType === 'user') {
    this.rating.userRating = {
      rating,
      comment,
      ratedAt: new Date()
    };
  } else if (userType === 'driver') {
    this.rating.driverRating = {
      rating,
      comment,
      ratedAt: new Date()
    };
  }

  return this.save();
};

// Method to get trip summary
BookingSchema.methods.getTripSummary = function() {
  return {
    bookingNumber: this.bookingNumber,
    status: this.status,
    pickup: {
      address: this.pickup.location.address,
      date: this.pickup.date,
      time: this.pickup.time
    },
    destination: {
      address: this.destination.location.address
    },
    totalAmount: this.pricing.total,
    passengers: this.totalPassengers,
    estimatedDuration: this.estimatedDuration,
    estimatedDistance: this.estimatedDistance
  };
};

// Add pagination plugin
BookingSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Booking', BookingSchema);
