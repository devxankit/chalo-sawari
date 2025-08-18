const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create new vehicle
// @route   POST /api/vehicles
// @access  Private (Driver)
const createVehicle = asyncHandler(async (req, res) => {
  const {
    type,
    brand,
    model,
    year,
    color,
    fuelType,
    transmission = 'manual',
    seatingCapacity,
    engineCapacity,
    mileage,
    isAc = false,
    isSleeper = false,
    amenities = [],
    registrationNumber,
    chassisNumber,
    engineNumber,
    rcNumber,
    rcExpiryDate,
    insuranceNumber,
    insuranceExpiryDate,
    fitnessNumber,
    fitnessExpiryDate,
    permitNumber,
    permitExpiryDate,
    pucNumber,
    pucExpiryDate,
    baseFare,
    perKmRate,
    workingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    workingHoursStart = '06:00',
    workingHoursEnd = '22:00',
    operatingCities = [],
    operatingStates = []
  } = req.body;

  // Check if driver already has a vehicle with this registration number
  const existingVehicle = await Vehicle.findOne({
    registrationNumber: registrationNumber.toUpperCase(),
    driver: req.driver.id
  });

  if (existingVehicle) {
    return res.status(400).json({
      success: false,
      message: 'A vehicle with this registration number already exists in your fleet'
    });
  }

  // Create vehicle object
  const vehicleData = {
    driver: req.driver.id,
    type,
    brand,
    model,
    year: parseInt(year),
    color,
    fuelType,
    transmission,
    seatingCapacity: parseInt(seatingCapacity),
    engineCapacity: engineCapacity ? parseInt(engineCapacity) : undefined,
    mileage: mileage ? parseInt(mileage) : undefined,
    isAc,
    isSleeper,
    amenities,
    registrationNumber: registrationNumber.toUpperCase(),
    chassisNumber: chassisNumber ? chassisNumber.toUpperCase() : undefined,
    engineNumber: engineNumber ? engineNumber.toUpperCase() : undefined,
    documents: {
      rc: {
        number: rcNumber,
        expiryDate: new Date(rcExpiryDate),
        isVerified: false
      }
    },
    pricing: {
      baseFare: parseFloat(baseFare) || 0,
      perKmRate: parseFloat(perKmRate) || 0,
      surgeMultiplier: 1.0
    },
    schedule: {
      workingDays,
      workingHours: {
        start: workingHoursStart,
        end: workingHoursEnd
      }
    },
    operatingArea: {
      cities: operatingCities,
      states: operatingStates
    }
  };

  // Add optional documents if provided
  if (insuranceNumber && insuranceExpiryDate) {
    vehicleData.documents.insurance = {
      number: insuranceNumber,
      expiryDate: new Date(insuranceExpiryDate),
      isVerified: false
    };
  }

  if (fitnessNumber && fitnessExpiryDate) {
    vehicleData.documents.fitness = {
      number: fitnessNumber,
      expiryDate: new Date(fitnessExpiryDate),
      isVerified: false
    };
  }

  if (permitNumber && permitExpiryDate) {
    vehicleData.documents.permit = {
      number: permitNumber,
      expiryDate: new Date(permitExpiryDate),
      isVerified: false
    };
  }

  if (pucNumber && pucExpiryDate) {
    vehicleData.documents.puc = {
      number: pucNumber,
      expiryDate: new Date(pucExpiryDate),
      isVerified: false
    };
  }

  const vehicle = await Vehicle.create(vehicleData);

  // Populate driver information
  await vehicle.populate({
    path: 'driver',
    select: 'firstName lastName phone rating'
  });

  res.status(201).json({
    success: true,
    message: 'Vehicle created successfully',
    data: vehicle
  });
});

// @desc    Get driver's vehicles
// @route   GET /api/vehicles/driver/my-vehicles
// @access  Private (Driver)
const getDriverVehicles = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, type } = req.query;

  const query = { driver: req.driver.id };

  if (status && status !== 'all') {
    query.status = status;
  }

  if (type && type !== 'all') {
    query.type = type;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: {
      path: 'driver',
      select: 'firstName lastName phone rating'
    }
  };

  const vehicles = await Vehicle.paginate(query, options);

  res.json({
    success: true,
    data: vehicles
  });
});

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
// @access  Private (Driver)
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Check if the current user is the driver of this vehicle
  if (vehicle.driver.toString() !== req.driver.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this vehicle'
    });
  }

  // Update vehicle fields
  const updatedVehicle = await Vehicle.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate({
    path: 'driver',
    select: 'firstName lastName phone rating'
  });

  res.json({
    success: true,
    message: 'Vehicle updated successfully',
    data: updatedVehicle
  });
});

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private (Driver)
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Check if the current user is the driver of this vehicle
  if (vehicle.driver.toString() !== req.driver.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this vehicle'
    });
  }

  // Check if vehicle has active bookings
  const activeBookings = await Booking.findOne({
    vehicle: req.params.id,
    status: { $in: ['confirmed', 'in-progress', 'completed'] }
  });

  if (activeBookings) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete vehicle with active bookings'
    });
  }

  await Vehicle.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Vehicle deleted successfully'
  });
});

// @desc    Upload vehicle images
// @route   POST /api/vehicles/:id/images
// @access  Private (Driver)
const uploadVehicleImages = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Check if the current user is the driver of this vehicle
  if (vehicle.driver.toString() !== req.driver.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this vehicle'
    });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No images uploaded'
    });
  }

  // Process uploaded images
  const imageUrls = req.files.map((file, index) => {
    // cloudinary multer returns path and filename/public_id
    const url = file.path || (file.secure_url ? file.secure_url : null);
    const caption = file.originalname || `Vehicle image ${index + 1}`;
    return {
      url,
      caption,
      isPrimary: false,
    };
  }).filter(img => !!img.url);

  // Add new images to existing ones
  vehicle.images = [...vehicle.images, ...imageUrls];

  // Ensure only one primary image
  if (vehicle.images.length > 0) {
    // Set the first image as primary if none marked
    const hasPrimary = vehicle.images.some(i => i.isPrimary);
    if (!hasPrimary) {
      vehicle.images[0].isPrimary = true;
    }
  }

  await vehicle.save();

  res.json({
    success: true,
    message: 'Images uploaded successfully',
    data: {
      images: vehicle.images,
      totalImages: vehicle.images.length
    }
  });
});

// @desc    Remove vehicle image
// @route   DELETE /api/vehicles/:id/images/:imageId
// @access  Private (Driver)
const removeVehicleImage = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Check if the current user is the driver of this vehicle
  if (vehicle.driver.toString() !== req.driver.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this vehicle'
    });
  }

  const imageIndex = vehicle.images.findIndex(
    img => img._id.toString() === req.params.imageId
  );

  if (imageIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Image not found'
    });
  }

  // Don't allow removing the last image
  if (vehicle.images.length <= 1) {
    return res.status(400).json({
      success: false,
      message: 'Cannot remove the last image'
    });
  }

  // Remove the image
  vehicle.images.splice(imageIndex, 1);

  // If primary image was removed, make first image primary
  if (vehicle.images.length > 0) {
    vehicle.images[0].isPrimary = true;
  }

  await vehicle.save();

  res.json({
    success: true,
    message: 'Image removed successfully',
    data: {
      images: vehicle.images,
      totalImages: vehicle.images.length
    }
  });
});

// @desc    Search vehicles
// @route   GET /api/vehicles/search
// @access  Public
const searchVehicles = asyncHandler(async (req, res) => {
  const {
    pickup,
    destination,
    date,
    passengers = 1,
    vehicleType,
    page = 1,
    limit = 10
  } = req.query;

  // Build search query
  let query = {
    isAvailable: true,
    isActive: true,
    approvalStatus: 'approved',
    'seatingCapacity': { $gte: parseInt(passengers) }
  };

  if (vehicleType) {
    query.type = vehicleType;
  }

  // If pickup and destination are provided, find vehicles near pickup location
  if (pickup && destination) {
    // For now, we'll search for available vehicles
    // In a real app, you'd implement geospatial search here
    query.isAvailable = true;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { rating: -1, 'pricing.baseFare': 1 },
    populate: {
      path: 'driver',
      select: 'firstName lastName rating phone isOnline',
      match: { isOnline: true, status: 'active' }
    }
  };

  const vehicles = await Vehicle.paginate(query, options);

  // Filter out vehicles without available drivers
  vehicles.docs = vehicles.docs.filter(vehicle => vehicle.driver);

  res.json({
    success: true,
    data: vehicles
  });
});

// @desc    Get vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate({
      path: 'driver',
      select: 'firstName lastName rating phone isOnline status'
    });

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  res.json({
    success: true,
    data: vehicle
  });
});


// @desc    Get vehicle types
// @route   GET /api/vehicles/bus
// @access  Public


const getVehicleBus = asyncHandler(async (req, res) => {
  try {
    const buses = await Vehicle.find({ 
      type: 'bus',
      approvalStatus: 'approved',
      isAvailable: true,
      isActive: true
    })
      .populate({
        path: 'driver',
        select: 'firstName lastName rating phone isOnline status',
        match: { isActive: true }
      })
      .sort({ createdAt: -1 });
    // Filter out vehicles without drivers
    const availableBuses = buses.filter(bus => bus.driver);
    res.status(200).json({
      success: true,
      count: availableBuses.length,
      data: availableBuses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});





// @desc    Get all auto vehicles
// @route   GET /api/vehicles/auto
// @access  Public
const getVehicleAuto = asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Searching for auto vehicles with criteria:', {
      type: 'auto',
      approvalStatus: 'approved',
      isAvailable: true,
      isActive: true
    });

    // First, let's see ALL auto vehicles regardless of status
    const allAutos = await Vehicle.find({ type: 'auto' });
    console.log('📊 Total auto vehicles in database:', allAutos.length);
    
    allAutos.forEach(auto => {
      console.log('🚗 Auto vehicle details:', {
        id: auto._id,
        type: auto.type,
        approvalStatus: auto.approvalStatus,
        isAvailable: auto.isAvailable,
        isActive: auto.isActive,
        brand: auto.brand,
        model: auto.model,
        driver: auto.driver
      });
    });

    // Check each filtering criteria separately
    const typeFilter = await Vehicle.find({ type: 'auto' });
    console.log('🔍 Type filter (auto):', typeFilter.length);

    const approvalFilter = await Vehicle.find({ type: 'auto', approvalStatus: 'approved' });
    console.log('✅ Approval filter (approved):', approvalFilter.length);

    const availableFilter = await Vehicle.find({ type: 'auto', approvalStatus: 'approved', isAvailable: true });
    console.log('🟢 Available filter (isAvailable: true):', availableFilter.length);

    const activeFilter = await Vehicle.find({ type: 'auto', approvalStatus: 'approved', isAvailable: true, isActive: true });
    console.log('🟢 Active filter (isActive: true):', activeFilter.length);

    // Now apply the proper filtering
    const autos = await Vehicle.find({ 
      type: 'auto',
      approvalStatus: 'approved',
      isAvailable: true,
      isActive: true
    });
    
    console.log('✅ Found approved autos:', autos.length);

    const populatedAutos = await Vehicle.find({ 
      type: 'auto',
      approvalStatus: 'approved',
      isAvailable: true,
      isActive: true
    })
      .populate({
        path: 'driver',
        select: 'firstName lastName rating phone isOnline status',
        match: { isActive: true }
      })
      .sort({ createdAt: -1 });

    console.log('👥 Populated autos with drivers:', populatedAutos.length);

    // Filter out vehicles without drivers
    const availableAutos = populatedAutos.filter(auto => auto.driver);
    console.log('🎯 Final available autos (with active drivers):', availableAutos.length);

    res.status(200).json({
      success: true,
      count: availableAutos.length,
      data: availableAutos,
      debug: {
        totalAutos: allAutos.length,
        approvedAutos: approvalFilter.length,
        availableAutos: availableFilter.length,
        activeAutos: activeFilter.length,
        finalAutos: availableAutos.length
      }
    });
  } catch (error) {
    console.error('❌ Error in getVehicleAuto:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get all car vehicles
// @route   GET /api/vehicles/car
// @access  Public
const getVehicleCar = asyncHandler(async (req, res) => {
  try {
    const cars = await Vehicle.find({ 
      type: 'car',
      approvalStatus: 'approved',
      isAvailable: true,
      isActive: true
    })
      .populate({
        path: 'driver',
        select: 'firstName lastName rating phone isOnline status',
        match: { isActive: true }
      })
      .sort({ createdAt: -1 });

    // Filter out vehicles without drivers
    const availableCars = cars.filter(car => car.driver);

    res.status(200).json({
      success: true,
      count: availableCars.length,
      data: availableCars
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get vehicle types
// @route   GET /api/vehicles/types
// @access  Public
const getVehicleTypes = asyncHandler(async (req, res) => {
  const vehicleTypes = await Vehicle.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        avgBaseFare: { $avg: '$pricing.baseFare' }
      }
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        avgRating: { $round: ['$avgRating', 1] },
        avgBaseFare: { $round: ['$avgBaseFare', 2] }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.json({
    success: true,
    data: vehicleTypes
  });
});

// @desc    Get available vehicles near location
// @route   GET /api/vehicles/nearby
// @access  Public
const getNearbyVehicles = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 10, vehicleType, passengers = 1 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }

  // Convert radius from km to degrees (approximate)
  const radiusInDegrees = radius / 111;

  const query = {
    isAvailable: true,
    'seatingCapacity': { $gte: parseInt(passengers) },
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    }
  };

  if (vehicleType) {
    query.type = vehicleType;
  }

  const vehicles = await Vehicle.find(query)
    .populate({
      path: 'driver',
      select: 'firstName lastName rating phone isOnline status',
      match: { isOnline: true, status: 'active' }
    })
    .limit(20)
    .sort({ rating: -1, 'pricing.baseFare': 1 });

  // Filter out vehicles without available drivers
  const availableVehicles = vehicles.filter(vehicle => vehicle.driver);

  res.json({
    success: true,
    data: availableVehicles
  });
});

// @desc    Calculate fare estimate
// @route   POST /api/vehicles/estimate-fare
// @access  Public
const estimateFare = asyncHandler(async (req, res) => {
  const {
    vehicleId,
    pickup,
    destination,
    passengers = 1,
    date,
    time
  } = req.body;

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Calculate distance (in a real app, you'd use Google Maps API)
  // For now, we'll use a simple calculation
  const distance = calculateDistance(pickup, destination);
  
  // Calculate base fare
  const baseFare = vehicle.pricing.baseFare;
  const distanceFare = distance * vehicle.pricing.perKmRate;
  
  // Add surge pricing if applicable
  const surgeMultiplier = calculateSurgePricing(date, time);
  
  // Calculate total fare
  const subtotal = (baseFare + distanceFare) * surgeMultiplier;
  const taxes = subtotal * 0.18; // 18% GST
  const totalFare = subtotal + taxes;

  res.json({
    success: true,
    data: {
      vehicle: {
        id: vehicle._id,
        type: vehicle.type,
        brand: vehicle.brand,
        model: vehicle.model,
        seatingCapacity: vehicle.seatingCapacity
      },
      trip: {
        pickup,
        destination,
        distance: distance.toFixed(2),
        estimatedDuration: (distance * 2).toFixed(0) // Rough estimate: 2 min per km
      },
      pricing: {
        baseFare,
        distanceFare: distanceFare.toFixed(2),
        surgeMultiplier: surgeMultiplier.toFixed(2),
        subtotal: subtotal.toFixed(2),
        taxes: taxes.toFixed(2),
        totalFare: totalFare.toFixed(2)
      }
    }
  });
});

// @desc    Get vehicle reviews
// @route   GET /api/vehicles/:id/reviews
// @access  Public
const getVehicleReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 }
  };

  const reviews = await Booking.paginate(
    {
      vehicle: req.params.id,
      'ratings.vehicle': { $exists: true }
    },
    {
      ...options,
      populate: {
        path: 'user',
        select: 'firstName lastName'
      },
      select: 'ratings.vehicle ratings.comment createdAt'
    }
  );

  res.json({
    success: true,
    data: reviews
  });
});

// @desc    Update vehicle location
// @route   PUT /api/vehicles/:id/location
// @access  Private (Driver)
const updateVehicleLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, address } = req.body;

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Check if the current user is the driver of this vehicle
  if (vehicle.driver.toString() !== req.driver.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this vehicle'
    });
  }

  vehicle.location = {
    coordinates: [longitude, latitude],
    address,
    lastUpdated: new Date()
  };

  await vehicle.save();

  res.json({
    success: true,
    data: vehicle.location
  });
});

// @desc    Update vehicle availability
// @route   PUT /api/vehicles/:id/availability
// @access  Private (Driver)
const updateVehicleAvailability = asyncHandler(async (req, res) => {
  const { isAvailable, reason } = req.body;

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Check if the current user is the driver of this vehicle
  if (vehicle.driver.toString() !== req.driver.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this vehicle'
    });
  }

  vehicle.isAvailable = isAvailable;
  vehicle.availabilityHistory.push({
    status: isAvailable ? 'available' : 'unavailable',
    reason,
    timestamp: new Date()
  });

  await vehicle.save();

  res.json({
    success: true,
    data: {
      isAvailable: vehicle.isAvailable,
      lastUpdated: vehicle.availabilityHistory[vehicle.availabilityHistory.length - 1].timestamp
    }
  });
});

// @desc    Get vehicle maintenance history
// @route   GET /api/vehicles/:id/maintenance
// @access  Private (Driver)
const getVehicleMaintenance = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Check if the current user is the driver of this vehicle
  if (vehicle.driver.toString() !== req.driver.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this vehicle'
    });
  }

  res.json({
    success: true,
    data: vehicle.maintenance
  });
});

// @desc    Add maintenance record
// @route   POST /api/vehicles/:id/maintenance
// @access  Private (Driver)
const addMaintenanceRecord = asyncHandler(async (req, res) => {
  const {
    type,
    description,
    cost,
    date,
    nextServiceDate,
    serviceCenter
  } = req.body;

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  // Check if the current user is the driver of this vehicle
  if (vehicle.driver.toString() !== req.driver.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this vehicle'
    });
  }

  vehicle.maintenance.push({
    type,
    description,
    cost,
    date: new Date(date),
    nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : undefined,
    serviceCenter
  });

  await vehicle.save();

  res.json({
    success: true,
    data: vehicle.maintenance[vehicle.maintenance.length - 1]
  });
});

// Helper function to calculate distance between two points
function calculateDistance(pickup, destination) {
  // This is a simplified calculation
  // In a real app, you'd use Google Maps Distance Matrix API
  const lat1 = pickup.latitude;
  const lon1 = pickup.longitude;
  const lat2 = destination.latitude;
  const lon2 = destination.longitude;

  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

// Helper function to calculate surge pricing
function calculateSurgePricing(date, time) {
  // Simple surge pricing logic
  // In a real app, you'd implement more sophisticated algorithms
  const hour = new Date(time).getHours();
  
  // Peak hours: 7-9 AM and 5-7 PM
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return 1.5; // 50% surge
  }
  
  // Late night: 10 PM - 6 AM
  if (hour >= 22 || hour <= 6) {
    return 1.3; // 30% surge
  }
  
  return 1.0; // Normal pricing
}

module.exports = {
  createVehicle,
  getDriverVehicles,
  updateVehicle,
  deleteVehicle,
  uploadVehicleImages,
  removeVehicleImage,
  searchVehicles,
  getVehicleById,
  getVehicleTypes,
  getNearbyVehicles,
  estimateFare,
  getVehicleReviews,
  updateVehicleLocation,
  updateVehicleAvailability,
  getVehicleMaintenance,
  addMaintenanceRecord,
  getVehicleAuto,
  getVehicleBus,
  getVehicleCar
};
