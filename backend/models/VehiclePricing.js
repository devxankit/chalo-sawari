const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const VehiclePricingSchema = new mongoose.Schema({
  // Vehicle Category (auto, car, bus)
  category: {
    type: String,
    enum: ['auto', 'car', 'bus'],
    required: [true, 'Vehicle category is required']
  },
  
  // Vehicle Type (e.g., Auto, Sedan, Hatchback, SUV for cars)
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    trim: true
  },
  
  // Vehicle Model (e.g., Standard Auto, Honda City, Swift Dzire for cars)
  vehicleModel: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  
  // Trip Type (one-way or return)
  tripType: {
    type: String,
    enum: ['one-way', 'return'],
    required: [true, 'Trip type is required']
  },
  
  // Distance-based pricing (required for car and bus, optional for auto)
  distancePricing: {
    '50km': {
      type: Number,
      required: function() { return this.category !== 'auto'; },
      min: [0, 'Price cannot be negative'],
      default: 0
    },
    '100km': {
      type: Number,
      required: function() { return this.category !== 'auto'; },
      min: [0, 'Price cannot be negative'],
      default: 0
    },
    '150km': {
      type: Number,
      required: function() { return this.category !== 'auto'; },
      min: [0, 'Price cannot be negative'],
      default: 0
    },
    '200km': {
      type: Number,
      required: function() { return this.category !== 'auto'; },
      min: [0, 'Price cannot be negative'],
      default: 0
    }
  },
  
  // Base price (required for all categories)
  basePrice: {
    type: Number,
    required: [true, 'Base price is required'],
    min: [0, 'Base price cannot be negative']
  },
  
  // Additional charges
  nightCharge: {
    type: Number,
    default: 0,
    min: [0, 'Night charge cannot be negative']
  },
  
  acCharge: {
    type: Number,
    default: 0,
    min: [0, 'AC charge cannot be negative']
  },
  
  waitingCharge: {
    type: Number,
    default: 0,
    min: [0, 'Waiting charge cannot be negative']
  },
  
  // Status and metadata
  isActive: {
    type: Boolean,
    default: true
  },
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Admin who created this pricing is required']
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
VehiclePricingSchema.index({ 
  category: 1, 
  vehicleType: 1, 
  vehicleModel: 1, 
  tripType: 1 
}, { unique: true });

// Index for active pricing
VehiclePricingSchema.index({ isActive: 1 });

// Method to calculate fare based on distance
VehiclePricingSchema.methods.calculateFare = function(distance) {
  let totalFare = this.basePrice;
  
  // For auto, only use base price
  if (this.category === 'auto') {
    return Math.round(totalFare);
  }
  
  // For car and bus, calculate distance-based pricing
  let rate = this.distancePricing['200km']; // Default to highest distance rate
  
  if (distance <= 50) {
    rate = this.distancePricing['50km'];
  } else if (distance <= 100) {
    rate = this.distancePricing['100km'];
  } else if (distance <= 150) {
    rate = this.distancePricing['150km'];
  } else if (distance <= 200) {
    rate = this.distancePricing['200km'];
  }
  
  totalFare = (rate * distance) + this.basePrice;
  
  return Math.round(totalFare);
};

// Static method to get pricing by vehicle details
VehiclePricingSchema.statics.getPricing = function(category, vehicleType, vehicleModel, tripType) {
  return this.findOne({
    category,
    vehicleType,
    vehicleModel,
    tripType,
    isActive: true
  });
};

// Static method to get all pricing for a category
VehiclePricingSchema.statics.getCategoryPricing = function(category, tripType) {
  return this.find({
    category,
    tripType,
    isActive: true
  }).sort({ vehicleType: 1, vehicleModel: 1 });
};

// Static method to get default pricing
VehiclePricingSchema.statics.getDefaultPricing = function(category, vehicleType, tripType) {
  return this.findOne({
    category,
    vehicleType,
    tripType: tripType || 'one-way',
    isDefault: true,
    isActive: true
  });
};

// Add pagination plugin
VehiclePricingSchema.plugin(mongoosePaginate);

const VehiclePricing = mongoose.model('VehiclePricing', VehiclePricingSchema);

module.exports = VehiclePricing;
