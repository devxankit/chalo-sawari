const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const VehicleSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: [true, 'Driver is required']
  },
  type: {
    type: String,
    enum: ['bus', 'car', 'auto'],
    required: [true, 'Vehicle type is required']
  },
  brand: {
    type: String,
    required: [true, 'Vehicle brand is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Vehicle year is required'],
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  color: {
    type: String,
    required: [true, 'Vehicle color is required'],
    trim: true
  },
  fuelType: {
    type: String,
    enum: ['petrol', 'diesel', 'cng', 'electric', 'hybrid'],
    required: [true, 'Fuel type is required']
  },
  transmission: {
    type: String,
    enum: ['manual', 'automatic'],
    default: 'manual'
  },
  seatingCapacity: {
    type: Number,
    required: [true, 'Seating capacity is required'],
    min: [1, 'Seating capacity must be at least 1'],
    max: [100, 'Seating capacity cannot exceed 100']
  },
  engineCapacity: {
    type: Number,
    min: [0, 'Engine capacity cannot be negative']
  },
  mileage: {
    type: Number,
    min: [0, 'Mileage cannot be negative']
  },
  isAc: {
    type: Boolean,
    default: false
  },
  isSleeper: {
    type: Boolean,
    default: false
  },
  amenities: [{
    type: String,
    enum: ['wifi', 'tv', 'power', 'blanket', 'pillow', 'water', 'snacks', 'magazine', 'charging', 'usb', 'bluetooth', 'gps', 'camera', 'ac', 'sleeper']
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  documents: {
    rc: {
      number: {
        type: String,
        required: [true, 'RC number is required']
      },
      expiryDate: {
        type: Date,
        required: [true, 'RC expiry date is required']
      },
      image: String,
      isVerified: {
        type: Boolean,
        default: false
      }
    },
    insurance: {
      number: String,
      expiryDate: Date,
      image: String,
      isVerified: {
        type: Boolean,
        default: false
      }
    },
    fitness: {
      number: String,
      expiryDate: Date,
      image: String,
      isVerified: {
        type: Boolean,
        default: false
      }
    },
    permit: {
      number: String,
      expiryDate: Date,
      image: String,
      isVerified: {
        type: Boolean,
        default: false
      }
    },
    puc: {
      number: String,
      expiryDate: Date,
      image: String,
      isVerified: {
        type: Boolean,
        default: false
      }
    }
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  chassisNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  engineNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  booked: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  operatingArea: {
    cities: [String],
    states: [String],
    radius: {
      type: Number,
      default: 50 // km
    }
  },
  // Pricing reference - will be fetched from VehiclePricing model
  pricingReference: {
    category: {
      type: String,
      enum: ['auto', 'car', 'bus'],
      required: [true, 'Vehicle category is required']
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      trim: true
    },
    vehicleModel: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    }
  },
  // Actual pricing data - populated automatically from pricingReference
  pricing: {
    // Auto pricing (for auto category)
    autoPrice: {
      oneWay: {
        type: Number,
        required: false,
        min: [0, 'Auto one-way price cannot be negative'],
        default: 0
      },
      return: {
        type: Number,
        required: false,
        min: [0, 'Auto return price cannot be negative'],
        default: 0
      }
    },
    // Distance-based pricing (for car and bus categories)
    distancePricing: {
      oneWay: {
        '50km': {
          type: Number,
          required: false,
          min: [0, 'Distance pricing cannot be negative'],
          default: 0
        },
        '100km': {
          type: Number,
          required: false,
          min: [0, 'Distance pricing cannot be negative'],
          default: 0
        },
        '150km': {
          type: Number,
          required: false,
          min: [0, 'Distance pricing cannot be negative'],
          default: 0
        }
      },
      return: {
        '50km': {
          type: Number,
          required: false,
          min: [0, 'Distance pricing cannot be negative'],
          default: 0
        },
        '100km': {
          type: Number,
          required: false,
          min: [0, 'Distance pricing cannot be negative'],
          default: 0
        },
        '150km': {
          type: Number,
          required: false,
          min: [0, 'Distance pricing cannot be negative'],
          default: 0
        }
      }
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  schedule: {
    workingDays: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    workingHours: {
      start: {
        type: String,
        default: '06:00'
      },
      end: {
        type: String,
        default: '22:00'
      }
    },
    breakTime: {
      start: String,
      end: String
    }
  },
  maintenance: {
    lastService: Date,
    nextService: Date,
    serviceHistory: [{
      date: Date,
      description: String,
      cost: Number,
      serviceCenter: String,
      odometer: Number
    }],
    isUnderMaintenance: {
      type: Boolean,
      default: false
    },
    maintenanceReason: String
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    breakdown: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    }
  },
  statistics: {
    totalTrips: {
      type: Number,
      default: 0
    },
    totalDistance: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for vehicle display name
VehicleSchema.virtual('displayName').get(function() {
  return `${this.brand} ${this.model} (${this.year})`;
});

// Virtual for vehicle age
VehicleSchema.virtual('age').get(function() {
  return new Date().getFullYear() - this.year;
});

// Virtual for total documents
VehicleSchema.virtual('totalDocuments').get(function() {
  return Object.keys(this.documents).length;
});

// Virtual for verified documents count
VehicleSchema.virtual('verifiedDocumentsCount').get(function() {
  let count = 0;
  Object.values(this.documents).forEach(doc => {
    if (doc && doc.isVerified) count++;
  });
  return count;
});

// Virtual for document verification percentage
VehicleSchema.virtual('documentVerificationPercentage').get(function() {
  if (this.totalDocuments === 0) return 0;
  return Math.round((this.verifiedDocumentsCount / this.totalDocuments) * 100);
});

// Virtual for is fully verified
VehicleSchema.virtual('isFullyVerified').get(function() {
  return this.verifiedDocumentsCount === this.totalDocuments;
});

// Index for better query performance
VehicleSchema.index({ driver: 1, type: 1 });
VehicleSchema.index({ isAvailable: 1, isActive: 1, isVerified: 1 });
VehicleSchema.index({ 'currentLocation.coordinates': '2dsphere' });
VehicleSchema.index({ registrationNumber: 1, chassisNumber: 1, engineNumber: 1 });
// Avoid compound index on two array fields which MongoDB does not allow
VehicleSchema.index({ 'operatingArea.cities': 1 });
VehicleSchema.index({ 'operatingArea.states': 1 });

// Pre-save middleware to ensure only one primary image
VehicleSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // Keep only the first primary image
      this.images.forEach((img, index) => {
        if (index === 0) {
          img.isPrimary = true;
        } else {
          img.isPrimary = false;
        }
      });
    }
  }
  next();
});

// Method to update current location
VehicleSchema.methods.updateLocation = function(latitude, longitude, address) {
  this.currentLocation.coordinates = [longitude, latitude];
  this.currentLocation.address = address;
  this.currentLocation.lastUpdated = new Date();
  return this.save();
};

// Method to add rating
VehicleSchema.methods.addRating = function(rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  this.ratings.count += 1;
  this.ratings.breakdown[rating] += 1;
  
  // Calculate new average
  let total = 0;
  let count = 0;
  Object.entries(this.ratings.breakdown).forEach(([star, num]) => {
    total += parseInt(star) * num;
    count += num;
  });
  
  this.ratings.average = count > 0 ? total / count : 0;
  this.statistics.averageRating = this.ratings.average;
  
  return this.save();
};

// Method to calculate fare using stored pricing
VehicleSchema.methods.calculateFare = function(distance, tripType = 'one-way') {
  // Use the stored pricing data directly - no need to populate
  if (!this.pricing) {
    throw new Error('Vehicle pricing not available');
  }
  
  let fare = 0;
  
  // For auto, use auto price
  if (this.pricingReference.category === 'auto') {
    if (tripType === 'one-way') {
      fare = this.pricing.autoPrice.oneWay || 0;
    } else {
      fare = this.pricing.autoPrice.return || 0;
    }
  } else {
    // For car and bus, calculate distance-based pricing
    const pricing = this.pricing.distancePricing[tripType] || this.pricing.distancePricing['one-way'];
    
    if (!pricing) {
      throw new Error('Distance pricing not available for this trip type');
    }
    
    let rate = pricing['150km'] || 0; // Default to highest distance rate
    
    if (distance <= 50) {
      rate = pricing['50km'] || 0;
    } else if (distance <= 100) {
      rate = pricing['100km'] || 0;
    } else if (distance <= 150) {
      rate = pricing['150km'] || 0;
    }
    
    fare = rate * distance;
  }
  
  return Math.round(fare);
};

// Method to check if vehicle is available for booking
VehicleSchema.methods.isAvailableForBooking = function(date, time) {
  if (!this.isAvailable || !this.isActive || !this.isVerified || this.approvalStatus !== 'approved' || this.booked) {
    return false;
  }
  
  if (this.maintenance.isUnderMaintenance) {
    return false;
  }
  
  // Check working days
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'lowercase' });
  if (!this.schedule.workingDays.includes(dayOfWeek)) {
    return false;
  }
  
  // Check working hours
  const hour = parseInt(time.split(':')[0]);
  const startHour = parseInt(this.schedule.workingHours.start.split(':')[0]);
  const endHour = parseInt(this.schedule.workingHours.end.split(':')[0]);
  
  if (hour < startHour || hour >= endHour) {
    return false;
  }
  
  return true;
};

// Method to update statistics
VehicleSchema.methods.updateStatistics = function(tripDistance, tripEarnings) {
  this.statistics.totalTrips += 1;
  this.statistics.totalDistance += tripDistance;
  this.statistics.totalEarnings += tripEarnings;
  return this.save();
};

// Method to mark vehicle as booked
VehicleSchema.methods.markAsBooked = function() {
  this.booked = true;
  this.isAvailable = false;
  return this.save();
};

// Method to mark vehicle as available
VehicleSchema.methods.markAsAvailable = function() {
  this.booked = false;
  this.isAvailable = true;
  return this.save();
};

// Method to approve vehicle
VehicleSchema.methods.approveVehicle = function(adminId, notes = '') {
  this.approvalStatus = 'approved';
  this.isApproved = true;
  this.adminNotes = notes;
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  return this.save();
};

// Method to reject vehicle
VehicleSchema.methods.rejectVehicle = function(adminId, reason = '', notes = '') {
  this.approvalStatus = 'rejected';
  this.isApproved = false;
  this.adminNotes = notes;
  this.rejectionReason = reason;
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  return this.save();
};

// Add pagination plugin
VehicleSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Vehicle', VehicleSchema);
