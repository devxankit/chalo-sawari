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
      required: [true, 'Pickup date is required']
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
      enum: ['cash', 'upi', 'netbanking', 'card'],
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

module.exports = mongoose.model('Booking', BookingSchema);
