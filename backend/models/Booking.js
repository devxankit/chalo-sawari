const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  // User information (from logged-in user)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  
  // Vehicle information
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required']
  },
  
  // Driver information (from vehicle)
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: [true, 'Driver is required']
  },
  
  // Trip details
  tripDetails: {
    pickup: {
      latitude: {
        type: Number,
        required: [true, 'Pickup latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Pickup longitude is required']
      },
      address: {
        type: String,
        required: [true, 'Pickup address is required']
      }
    },
    destination: {
      latitude: {
        type: Number,
        required: [true, 'Destination latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Destination longitude is required']
      },
      address: {
        type: String,
        required: [true, 'Destination address is required']
      }
    },
    date: {
      type: String, // Simple date string like "2025-08-06"
      required: [true, 'Pickup date is required'],
      validate: {
        validator: function(v) {
          // Accept YYYY-MM-DD format and validate it's a real date
          if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
            return false;
          }
          const date = new Date(v);
          return !isNaN(date.getTime());
        },
        message: 'Date must be in YYYY-MM-DD format and be a valid date'
      }
    },
    time: {
      type: String, // Simple time string like "09:00" or "09:00:00"
      required: [true, 'Pickup time is required'],
      validate: {
        validator: function(v) {
          // Accept both "HH:MM" and "HH:MM:SS" formats
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(v);
        },
        message: 'Time must be in HH:MM or HH:MM:SS format'
      }
    },
    passengers: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 passenger required']
    },
    distance: {
      type: Number,
      required: [true, 'Distance is required']
    },
    duration: {
      type: Number, // Estimated duration in minutes
      default: 0
    }
  },
  
  // Pricing information
  pricing: {
    ratePerKm: {
      type: Number,
      required: [true, 'Rate per km is required']
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required']
    },
    tripType: {
      type: String,
      enum: ['one-way', 'return'],
      default: 'one-way'
    }
  },
  
  // Payment information
  payment: {
    method: {
      type: String,
      enum: ['cash', 'upi', 'netbanking', 'card', 'razorpay'],
      required: [true, 'Payment method is required']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    }
  },
  
  // Booking status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'started', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Status history for tracking changes
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'accepted', 'started', 'completed', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'statusHistory.updatedByModel'
    },
    updatedByModel: {
      type: String,
      enum: ['User', 'Driver', 'Admin'],
      required: true
    },
    reason: String,
    notes: String
  }],
  
  // Trip details for actual trip data
  trip: {
    startTime: Date,
    endTime: Date,
    actualDistance: Number,
    actualDuration: Number,
    actualFare: Number,
    driverNotes: String,
    userNotes: String
  },
  
  // Cancellation details
  cancellation: {
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'cancellation.cancelledByModel'
    },
    cancelledByModel: {
      type: String,
      enum: ['User', 'Driver', 'Admin']
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'completed'],
      default: 'pending'
    }
  },
  
  // Additional information
  specialRequests: {
    type: String,
    default: ''
  },
  
  // Booking number (auto-generated)
  bookingNumber: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate booking number
BookingSchema.pre('save', function(next) {
  if (this.isNew && !this.bookingNumber) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingNumber = `CS${timestamp}${random}`;
  }
  next();
});

// Pre-save middleware to track status changes and update vehicle status
BookingSchema.pre('save', async function(next) {
  // Only proceed if status has changed
  if (this.isModified('status')) {
    try {
      console.log(`📋 Booking ${this._id} status changed to: ${this.status}`);
      
      const Vehicle = require('./Vehicle');
      const vehicle = await Vehicle.findById(this.vehicle);
      
      if (!vehicle) {
        return next(new Error('Vehicle not found'));
      }
      
      console.log(`🚗 Vehicle ${vehicle._id} current status: ${vehicle.bookingStatus}, booked: ${vehicle.booked}`);
      
      // Add status to history
      if (!this.statusHistory) {
        this.statusHistory = [];
      }
      
      // Determine who updated the status
      let updatedByModel = 'User';
      let updatedBy = this.user;
      
      // This will be set by the controller based on the authenticated user
      if (this._updatedByModel && this._updatedBy) {
        updatedByModel = this._updatedByModel;
        updatedBy = this._updatedBy;
      }
      
      this.statusHistory.push({
        status: this.status,
        timestamp: new Date(),
        updatedBy: updatedBy,
        updatedByModel: updatedByModel,
        reason: this._statusReason || '',
        notes: this._statusNotes || ''
      });
      
      // Update vehicle status based on booking status
      switch (this.status) {
        case 'accepted':
          console.log(`🚗 Updating vehicle ${vehicle._id} to booked status`);
          await vehicle.markAsBooked(this._id);
          break;
        case 'started':
          console.log(`🚗 Updating vehicle ${vehicle._id} to in_trip status`);
          await vehicle.markAsInTrip();
          break;
        case 'completed':
        case 'cancelled':
          console.log(`🚗 Updating vehicle ${vehicle._id} to available status`);
          await vehicle.markAsAvailable();
          break;
        default:
          console.log(`🚗 No vehicle status change for status: ${this.status}`);
          break;
      }
      
      console.log(`🚗 Vehicle ${vehicle._id} status updated to: ${vehicle.bookingStatus}, booked: ${vehicle.booked}`);
      
      // Clear temporary fields
      delete this._updatedByModel;
      delete this._updatedBy;
      delete this._statusReason;
      delete this._statusNotes;
      
    } catch (error) {
      console.error(`❌ Error updating vehicle status for booking ${this._id}:`, error);
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);
