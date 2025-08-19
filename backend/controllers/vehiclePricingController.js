const VehiclePricing = require('../models/VehiclePricing');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all vehicle pricing
// @route   GET /api/admin/vehicle-pricing
// @access  Private (Admin only)
const getAllVehiclePricing = asyncHandler(async (req, res) => {
  const { category, tripType, page = 1, limit = 50 } = req.query;
  
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (tripType) filter.tripType = tripType;
  
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { category: 1, vehicleType: 1, vehicleModel: 1 }
  };
  
  const pricing = await VehiclePricing.paginate(filter, options);
  
  res.status(200).json({
    success: true,
    data: pricing
  });
});

// @desc    Get vehicle pricing by ID
// @route   GET /api/admin/vehicle-pricing/:id
// @access  Private (Admin only)
const getVehiclePricingById = asyncHandler(async (req, res) => {
  const pricing = await VehiclePricing.findById(req.params.id);
  
  if (!pricing) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle pricing not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: pricing
  });
});

// @desc    Create new vehicle pricing
// @route   POST /api/admin/vehicle-pricing
// @access  Private (Admin only)
const createVehiclePricing = asyncHandler(async (req, res) => {
  const {
    category,
    vehicleType,
    vehicleModel,
    tripType,
    autoPrice,
    distancePricing,
    notes,
    isActive = true,
    isDefault = false
  } = req.body;
  
  // Check if pricing already exists
  const existingPricing = await VehiclePricing.findOne({
    category,
    vehicleType,
    vehicleModel,
    tripType
  });
  
  if (existingPricing) {
    return res.status(400).json({
      success: false,
      message: 'Pricing for this vehicle configuration already exists'
    });
  }
  
  const pricing = await VehiclePricing.create({
    category,
    vehicleType,
    vehicleModel,
    tripType,
    autoPrice,
    distancePricing,
    notes,
    isActive,
    isDefault,
    createdBy: req.admin.id
  });
  
  res.status(201).json({
    success: true,
    data: pricing,
    message: 'Vehicle pricing created successfully'
  });
});

// @desc    Update vehicle pricing
// @route   PUT /api/admin/vehicle-pricing/:id
// @access  Private (Admin only)
const updateVehiclePricing = asyncHandler(async (req, res) => {
  const {
    autoPrice,
    distancePricing,
    notes,
    isActive
  } = req.body;
  
  const pricing = await VehiclePricing.findById(req.params.id);
  
  if (!pricing) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle pricing not found'
    });
  }
  
  // Update fields
  if (autoPrice !== undefined) pricing.autoPrice = autoPrice;
  if (distancePricing) pricing.distancePricing = distancePricing;
  if (notes !== undefined) pricing.notes = notes;
  if (isActive !== undefined) pricing.isActive = isActive;
  
  pricing.updatedBy = req.admin.id;
  
  await pricing.save();
  
  res.status(200).json({
    success: true,
    data: pricing,
    message: 'Vehicle pricing updated successfully'
  });
});

// @desc    Delete vehicle pricing
// @route   DELETE /api/admin/vehicle-pricing/:id
// @access  Private (Admin only)
const deleteVehiclePricing = asyncHandler(async (req, res) => {
  const pricing = await VehiclePricing.findById(req.params.id);
  
  if (!pricing) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle pricing not found'
    });
  }
  
  // Soft delete by setting isActive to false
  pricing.isActive = false;
  pricing.updatedBy = req.admin.id;
  await pricing.save();
  
  res.status(200).json({
    success: true,
    message: 'Vehicle pricing deleted successfully'
  });
});

// @desc    Bulk create/update vehicle pricing
// @route   POST /api/admin/vehicle-pricing/bulk
// @access  Private (Admin only)
const bulkUpdateVehiclePricing = asyncHandler(async (req, res) => {
  const { pricingData } = req.body;
  
  if (!Array.isArray(pricingData)) {
    return res.status(400).json({
      success: false,
      message: 'pricingData must be an array'
    });
  }
  
  const results = [];
  
  for (const item of pricingData) {
    const {
      category,
      vehicleType,
      vehicleModel,
      tripType,
      autoPrice,
      distancePricing,
      notes,
      isActive = true,
      isDefault = false
    } = item;
    
    try {
      // Check if pricing exists
      let pricing = await VehiclePricing.findOne({
        category,
        vehicleType,
        vehicleModel,
        tripType
      });
      
      if (pricing) {
        // Update existing
        if (autoPrice !== undefined) pricing.autoPrice = autoPrice;
        pricing.distancePricing = distancePricing;
        pricing.notes = notes;
        pricing.isActive = isActive;
        pricing.isDefault = isDefault;
        pricing.updatedBy = req.admin.id;
        await pricing.save();
        results.push({ ...item, action: 'updated', id: pricing._id });
      } else {
        // Create new
        pricing = await VehiclePricing.create({
          category,
          vehicleType,
          vehicleModel,
          tripType,
          autoPrice,
          distancePricing,
          notes,
          isActive,
          isDefault,
          createdBy: req.admin.id
        });
        results.push({ ...item, action: 'created', id: pricing._id });
      }
    } catch (error) {
      results.push({ ...item, action: 'error', error: error.message });
    }
  }
  
  res.status(200).json({
    success: true,
    data: results,
    message: 'Bulk pricing update completed'
  });
});

// @desc    Get pricing for fare calculation
// @route   GET /api/vehicle-pricing/calculate
// @access  Public
const getPricingForCalculation = asyncHandler(async (req, res) => {
  const { category, vehicleType, vehicleModel, tripType = 'one-way' } = req.query;
  
  if (!category || !vehicleType) {
    return res.status(400).json({
      success: false,
      message: 'Category and vehicleType are required'
    });
  }
  
  let pricing;
  
  if (vehicleModel) {
    // Get specific model pricing
    pricing = await VehiclePricing.getPricing(category, vehicleType, vehicleModel, tripType);
  } else {
    // Get default pricing for vehicle type
    pricing = await VehiclePricing.getDefaultPricing(category, vehicleType, tripType);
  }
  
  if (!pricing) {
    // Try to create default pricing for this combination
    try {
      const Admin = require('../models/Admin');
      const admin = await Admin.findOne({ isActive: true });
      
      if (admin) {
        // Create default pricing based on category
        let defaultPricing = null;
        
        if (category === 'auto') {
          defaultPricing = {
            category: 'auto',
            vehicleType: vehicleType,
            vehicleModel: vehicleModel || 'Standard Auto',
            tripType: tripType,
            autoPrice: 200,
            distancePricing: { '50km': 0, '100km': 0, '150km': 0 },
            isActive: true,
            isDefault: true,
            createdBy: admin._id,
            notes: `Default ${vehicleModel || 'Standard'} auto pricing`
          };
        } else if (category === 'car') {
          defaultPricing = {
            category: 'car',
            vehicleType: vehicleType,
            vehicleModel: vehicleModel || 'Standard Car',
            tripType: tripType,
            autoPrice: 0,
            distancePricing: { '50km': 12, '100km': 10, '150km': 8 },
            isActive: true,
            isDefault: true,
            createdBy: admin._id,
            notes: `Default ${vehicleModel || 'Standard'} car pricing`
          };
        } else if (category === 'bus') {
          defaultPricing = {
            category: 'bus',
            vehicleType: vehicleType,
            vehicleModel: vehicleModel || 'Standard Bus',
            tripType: tripType,
            autoPrice: 0,
            distancePricing: { '50km': 25, '100km': 20, '150km': 18 },
            isActive: true,
            isDefault: true,
            createdBy: admin._id,
            notes: `Default ${vehicleModel || 'Standard'} bus pricing`
          };
        }
        
        if (defaultPricing) {
          pricing = await VehiclePricing.create(defaultPricing);
          console.log(`✅ Created default pricing for ${category} ${vehicleType} ${vehicleModel || 'Standard'}`);
        }
      }
    } catch (createError) {
      console.error('❌ Error creating default pricing:', createError);
    }
  }
  
  if (!pricing) {
    return res.status(404).json({
      success: false,
      message: 'No pricing found for the specified vehicle configuration',
      details: {
        category,
        vehicleType,
        vehicleModel,
        tripType,
        suggestion: 'Please contact admin to set up pricing for this vehicle type'
      }
    });
  }
  
  res.status(200).json({
    success: true,
    data: pricing
  });
});

// @desc    Calculate fare
// @route   POST /api/vehicle-pricing/calculate-fare
// @access  Public
const calculateFare = asyncHandler(async (req, res) => {
  const {
    category,
    vehicleType,
    vehicleModel,
    tripType = 'one-way',
    distance
  } = req.body;
  
  if (!category || !vehicleType || !distance) {
    return res.status(400).json({
      success: false,
      message: 'Category, vehicleType, and distance are required'
    });
  }
  
  let pricing;
  
  if (vehicleModel) {
    pricing = await VehiclePricing.getPricing(category, vehicleType, vehicleModel, tripType);
  } else {
    pricing = await VehiclePricing.getDefaultPricing(category, vehicleType, tripType);
  }
  
  if (!pricing) {
    return res.status(404).json({
      success: false,
      message: 'No pricing found for the specified vehicle configuration'
    });
  }
  
  // Calculate fare using the model's calculateFare method
  const totalFare = pricing.calculateFare(distance);
  
  res.status(200).json({
    success: true,
    data: {
      totalFare,
      distancePricing: pricing.distancePricing,
      category: pricing.category
    }
  });
});

// @desc    Get pricing for a specific vehicle
// @route   GET /api/vehicle-pricing/vehicle/:vehicleId
// @access  Public
const getPricingForVehicle = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;
  
  // Import Vehicle model to avoid circular dependency
  const Vehicle = require('../models/Vehicle');
  
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }
  
  const pricing = await VehiclePricing.getPricing(
    vehicle.pricingReference.category,
    vehicle.pricingReference.vehicleType,
    vehicle.pricingReference.vehicleModel,
    'one-way' // Default to one-way trip
  );
  
  if (!pricing) {
    return res.status(404).json({
      success: false,
      message: 'No pricing found for this vehicle configuration'
    });
  }
  
  res.status(200).json({
    success: true,
    data: pricing
  });
});

// @desc    Get pricing categories and types
// @route   GET /api/vehicle-pricing/categories
// @access  Public
const getPricingCategories = asyncHandler(async (req, res) => {
  const categories = await VehiclePricing.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: {
          category: '$category',
          vehicleType: '$vehicleType'
        },
        models: { $addToSet: '$vehicleModel' }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        types: {
          $push: {
            type: '$_id.vehicleType',
            models: '$models'
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: categories
  });
});

module.exports = {
  getAllVehiclePricing,
  getVehiclePricingById,
  createVehiclePricing,
  updateVehiclePricing,
  deleteVehiclePricing,
  bulkUpdateVehiclePricing,
  getPricingForCalculation,
  calculateFare,
  getPricingForVehicle,
  getPricingCategories
};
