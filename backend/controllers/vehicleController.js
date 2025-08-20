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
    pricingReference,
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

  // Validate pricingReference
  if (!pricingReference || !pricingReference.category || !pricingReference.vehicleType || !pricingReference.vehicleModel) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle pricing reference is required (category, vehicleType, and vehicleModel)'
    });
  }

  // Verify that the pricing exists in VehiclePricing model for both trip types
  const VehiclePricing = require('../models/VehiclePricing');
  
  // Fetch one-way pricing
  const oneWayPricing = await VehiclePricing.getPricing(
    pricingReference.category,
    pricingReference.vehicleType,
    pricingReference.vehicleModel,
    'one-way'
  );

  // Fetch return pricing
  const returnPricing = await VehiclePricing.getPricing(
    pricingReference.category,
    pricingReference.vehicleType,
    pricingReference.vehicleModel,
    'return'
  );

  if (!oneWayPricing || !returnPricing) {
    return res.status(400).json({
      success: false,
      message: 'Pricing not found for one-way or return trips. Please contact admin to set up complete pricing.'
    });
  }

  // Auto-populate pricing data based on the pricing reference
  let autoPrice = {
    oneWay: 0,
    return: 0
  };
  let distancePricing = {
    oneWay: {
      '50km': 0,
      '100km': 0,
      '150km': 0
    },
    return: {
      '50km': 0,
      '100km': 0,
      '150km': 0
    }
  };

  if (pricingReference.category === 'auto') {
    autoPrice.oneWay = oneWayPricing.autoPrice;
    autoPrice.return = returnPricing.autoPrice;
  } else {
    distancePricing.oneWay = oneWayPricing.distancePricing;
    distancePricing.return = returnPricing.distancePricing;
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
    pricingReference,
    pricing: {
      autoPrice,
      distancePricing,
      lastUpdated: new Date()
    },
    workingDays,
    workingHoursStart,
    workingHoursEnd,
    operatingCities,
    operatingStates
  };

  // Add documents if provided
  if (rcNumber && rcExpiryDate) {
    vehicleData.documents = {
      rc: {
        number: rcNumber,
        expiryDate: new Date(rcExpiryDate),
        isVerified: false
      }
    };
  }

  if (insuranceNumber && insuranceExpiryDate) {
    if (!vehicleData.documents) vehicleData.documents = {};
    vehicleData.documents.insurance = {
      number: insuranceNumber,
      expiryDate: new Date(insuranceExpiryDate),
      isVerified: false
    };
  }

  if (fitnessNumber && fitnessExpiryDate) {
    if (!vehicleData.documents) vehicleData.documents = {};
    vehicleData.documents.fitness = {
      number: fitnessNumber,
      expiryDate: new Date(fitnessExpiryDate),
      isVerified: false
    };
  }

  if (permitNumber && permitExpiryDate) {
    if (!vehicleData.documents) vehicleData.documents = {};
    vehicleData.documents.permit = {
      number: permitNumber,
      expiryDate: new Date(permitExpiryDate),
      isVerified: false
    };
  }

  if (pucNumber && pucExpiryDate) {
    if (!vehicleData.documents) vehicleData.documents = {};
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

  // If pricingReference is being updated, validate it and update pricing
  if (req.body.pricingReference) {
    const { pricingReference } = req.body;
    
    if (!pricingReference.category || !pricingReference.vehicleType || !pricingReference.vehicleModel) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle pricing reference is required (category, vehicleType, and vehicleModel)'
      });
    }

    // Verify that the pricing exists in VehiclePricing model for both trip types
    const VehiclePricing = require('../models/VehiclePricing');
    
    // Fetch one-way pricing
    const oneWayPricing = await VehiclePricing.getPricing(
      pricingReference.category,
      pricingReference.vehicleType,
      pricingReference.vehicleModel,
      'one-way'
    );

    // Fetch return pricing
    const returnPricing = await VehiclePricing.getPricing(
      pricingReference.category,
      pricingReference.vehicleType,
      pricingReference.vehicleModel,
      'return'
    );

    if (!oneWayPricing || !returnPricing) {
      return res.status(400).json({
        success: false,
        message: 'Pricing not found for one-way or return trips. Please contact admin to set up complete pricing.'
      });
    }

    // Auto-update pricing data based on the new pricing reference
    let autoPrice = {
      oneWay: 0,
      return: 0
    };
    let distancePricing = {
      oneWay: {
        '50km': 0,
        '100km': 0,
        '150km': 0
      },
      return: {
        '50km': 0,
        '100km': 0,
        '150km': 0
      }
    };

    if (pricingReference.category === 'auto') {
      autoPrice.oneWay = oneWayPricing.autoPrice;
      autoPrice.return = returnPricing.autoPrice;
    } else {
      distancePricing.oneWay = oneWayPricing.distancePricing;
      distancePricing.return = returnPricing.distancePricing;
    }

    // Add pricing update to request body
    req.body.pricing = {
      autoPrice,
      distancePricing,
      lastUpdated: new Date()
    };
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

  // Clean, simple search query - only check essential vehicle status
  let query = {
    isActive: true,
    approvalStatus: 'approved',
    isAvailable: true,
    $or: [
      { bookingStatus: 'available' },
      { bookingStatus: { $exists: false }, booked: false }
    ],
    booked: false
  };

  // Filter by vehicle type if specified
  if (vehicleType) {
    query.type = vehicleType;
  }

  // Only check seating capacity if passengers is specified and greater than 1
  if (passengers && parseInt(passengers) > 1) {
    query.seatingCapacity = { $gte: parseInt(passengers) };
  }

  console.log(`🔍 Searching vehicles with query:`, query);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 }, // Sort by newest first
    populate: {
      path: 'driver',
      select: 'firstName lastName rating phone'
    }
  };

  const vehicles = await Vehicle.paginate(query, options);

  console.log(`🔍 Found ${vehicles.totalDocs} total vehicles, ${vehicles.docs.length} on current page`);

  // Clean response - vehicles already have pricing populated from the robust system
  // No need to compute or fetch pricing - it's already stored in vehicle.pricing
  const cleanVehicles = vehicles.docs.map(vehicle => {
    // Return clean vehicle object with only necessary fields
    return {
      _id: vehicle._id,
      type: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      fuelType: vehicle.fuelType,
      transmission: vehicle.transmission,
      seatingCapacity: vehicle.seatingCapacity,
      engineCapacity: vehicle.engineCapacity,
      mileage: vehicle.mileage,
      isAc: vehicle.isAc,
      isSleeper: vehicle.isSleeper,
      amenities: vehicle.amenities,
      images: vehicle.images,
      registrationNumber: vehicle.registrationNumber,
      chassisNumber: vehicle.chassisNumber,
      engineNumber: vehicle.engineNumber,
      operatingArea: vehicle.operatingArea,
      schedule: vehicle.schedule,
      rating: vehicle.rating,
      totalTrips: vehicle.totalTrips,
      totalEarnings: vehicle.totalEarnings,
      isActive: vehicle.isActive,
      approvalStatus: vehicle.approvalStatus,
      booked: vehicle.booked,
      isAvailable: vehicle.isAvailable,
      bookingStatus: vehicle.bookingStatus,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
      // Driver information
      driver: vehicle.driver ? {
        _id: vehicle.driver._id,
        firstName: vehicle.driver.firstName,
        lastName: vehicle.driver.lastName,
        rating: vehicle.driver.rating,
        phone: vehicle.driver.phone
      } : null,
      // Pricing information - directly from the robust pricing system
      pricing: vehicle.pricing || null,
      pricingReference: vehicle.pricingReference || null
    };
  });

  console.log(`✅ Returning ${cleanVehicles.length} clean vehicles with pricing`);

  res.json({
    success: true,
    message: `Found ${vehicles.totalDocs} vehicles`,
    data: {
      docs: cleanVehicles,
      totalDocs: vehicles.totalDocs,
      limit: vehicles.limit,
      page: vehicles.page,
      totalPages: vehicles.totalPages
    }
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
      isActive: true,
      $or: [
        { bookingStatus: 'available' },
        { bookingStatus: { $exists: false }, booked: false }
      ],
      booked: false
    })
      .populate({
        path: 'driver',
        select: 'firstName lastName rating phone isOnline status',
        match: { isActive: true }
      })
      .sort({ createdAt: -1 });
    // Filter out vehicles without drivers
    const availableBuses = buses.filter(bus => bus.driver);

    // Populate computed pricing for each bus
    const VehiclePricing = require('../models/VehiclePricing');
    
    // Debug: Check what pricing entries exist for bus vehicles
    try {
      const allBusPricing = await VehiclePricing.find({ category: 'bus', isActive: true });
      console.log(`🔍 Found ${allBusPricing.length} bus pricing entries in database:`, allBusPricing.map(p => ({
        id: p._id,
        vehicleType: p.vehicleType,
        vehicleModel: p.vehicleModel,
        basePrice: p.basePrice
      })));
      
      // If no bus pricing exists, create default entries
      if (allBusPricing.length === 0) {
        console.log('🚨 No bus pricing entries found. Creating default pricing...');
        await createDefaultBusPricing();
        console.log('✅ Default bus pricing created successfully');
      }
    } catch (pricingError) {
      console.error('❌ Error checking bus pricing entries:', pricingError);
    }
    
    const busesWithPricing = await Promise.all(
      availableBuses.map(async (bus) => {
        try {
          if (bus.pricingReference) {
            const pricing = await VehiclePricing.getPricing(
              bus.pricingReference.category,
              bus.pricingReference.vehicleType,
              bus.pricingReference.vehicleModel,
              'one-way'
            );
            
            if (pricing) {
              // Add computed pricing to the bus object
              bus.computedPricing = {
                basePrice: pricing.basePrice,
                distancePricing: pricing.distancePricing,
                category: pricing.category,
                vehicleType: pricing.vehicleType,
                vehicleModel: pricing.vehicleModel
              };
              console.log(`✅ Added computed pricing for bus ${bus._id}:`, bus.computedPricing);
            } else {
              console.log(`❌ No pricing found for bus ${bus._id}`);
              
              // Try to get default pricing for bus category
              try {
                const defaultPricing = await VehiclePricing.getDefaultPricing('bus', bus.pricingReference.vehicleType, 'one-way');
                if (defaultPricing) {
                  bus.computedPricing = {
                    basePrice: defaultPricing.basePrice,
                    distancePricing: defaultPricing.distancePricing,
                    category: defaultPricing.category,
                    vehicleType: defaultPricing.vehicleType,
                    vehicleModel: defaultPricing.vehicleModel
                  };
                  console.log(`✅ Using default pricing for bus ${bus._id}:`, bus.computedPricing);
                } else {
                  console.log(`❌ No default pricing found for bus ${bus._id}`);
                  
                  // Create default pricing for this bus if none exists
                  const createdPricing = await createPricingForBus(bus.pricingReference);
                  if (createdPricing) {
                    bus.computedPricing = {
                      basePrice: createdPricing.basePrice,
                      distancePricing: createdPricing.distancePricing,
                      category: createdPricing.category,
                      vehicleType: createdPricing.vehicleType,
                      vehicleModel: createdPricing.vehicleModel
                    };
                    console.log(`✅ Created and using default pricing for bus ${bus._id}:`, bus.computedPricing);
                  }
                }
              } catch (defaultError) {
                console.error(`❌ Error fetching default pricing for bus ${bus._id}:`, defaultError);
                
                // Final fallback: create default pricing
                try {
                  const createdPricing = await createPricingForBus(bus.pricingReference);
                  if (createdPricing) {
                    bus.computedPricing = {
                      basePrice: createdPricing.basePrice,
                      distancePricing: createdPricing.distancePricing,
                      category: createdPricing.category,
                      vehicleType: createdPricing.vehicleType,
                      vehicleModel: createdPricing.vehicleModel
                    };
                    console.log(`✅ Created fallback pricing for bus ${bus._id}:`, bus.computedPricing);
                  }
                } catch (createError) {
                  console.error(`❌ Failed to create fallback pricing for bus ${bus._id}:`, createError);
                }
              }
            }
          } else {
            console.log(`❌ Bus ${bus._id} has no pricingReference`);
            
            // Try to get any available pricing for bus category
            try {
              const anyBusPricing = await VehiclePricing.findOne({
                category: 'bus',
                isActive: true
              });
              
              if (anyBusPricing) {
                bus.computedPricing = {
                  basePrice: anyBusPricing.basePrice,
                  distancePricing: anyBusPricing.distancePricing,
                  category: anyBusPricing.category,
                  vehicleType: anyBusPricing.vehicleType,
                  vehicleModel: anyBusPricing.vehicleModel
                };
                console.log(`✅ Using available bus pricing for bus ${bus._id}:`, bus.computedPricing);
              } else {
                console.log(`❌ No bus pricing entries found in database`);
                
                // Create default pricing for bus category
                const defaultPricing = await createDefaultBusPricing();
                if (defaultPricing) {
                  bus.computedPricing = {
                    basePrice: defaultPricing.basePrice,
                    distancePricing: defaultPricing.distancePricing,
                    category: defaultPricing.category,
                    vehicleType: defaultPricing.vehicleType,
                    vehicleModel: defaultPricing.vehicleModel
                  };
                  console.log(`✅ Using newly created default pricing for bus ${bus._id}:`, bus.computedPricing);
                }
              }
            } catch (anyPricingError) {
              console.error(`❌ Error fetching any bus pricing:`, anyPricingError);
              
              // Final fallback: create default pricing
              try {
                const defaultPricing = await createDefaultBusPricing();
                if (defaultPricing) {
                  bus.computedPricing = {
                    basePrice: defaultPricing.basePrice,
                    distancePricing: defaultPricing.distancePricing,
                    category: defaultPricing.category,
                    vehicleType: defaultPricing.vehicleType,
                    vehicleModel: defaultPricing.vehicleModel
                  };
                  console.log(`✅ Using emergency fallback pricing for bus ${bus._id}:`, bus.computedPricing);
                }
              } catch (createError) {
                console.error(`❌ Failed to create emergency fallback pricing:`, createError);
              }
            }
          }
          return bus;
        } catch (error) {
          console.error(`❌ Error fetching pricing for bus ${bus._id}:`, error);
          return bus;
        }
      })
    );

    res.status(200).json({
      success: true,
      count: busesWithPricing.length,
      data: busesWithPricing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// Helper function to update existing auto pricing entries
const updateExistingAutoPricing = async () => {
  try {
    const VehiclePricing = require('../models/VehiclePricing');
    
    // Find all existing auto pricing entries that don't have autoPrice field
    const existingAutoPricing = await VehiclePricing.find({
      category: 'auto',
      autoPrice: { $exists: false }
    });
    
    if (existingAutoPricing.length === 0) {
      console.log('✅ All auto pricing entries already have autoPrice field');
      return;
    }
    
    console.log(`🔧 Found ${existingAutoPricing.length} auto pricing entries to update`);
    
    // Update each entry to include autoPrice field
    for (const pricing of existingAutoPricing) {
      // Use basePrice as autoPrice if it exists, otherwise use default
      const autoPrice = pricing.basePrice || getBasePriceForFuelType(pricing.vehicleModel);
      
      await VehiclePricing.findByIdAndUpdate(pricing._id, {
        autoPrice: autoPrice
      });
      
      console.log(`✅ Updated auto pricing for ${pricing.vehicleModel}: autoPrice = ${autoPrice}`);
    }
    
    console.log('✅ All existing auto pricing entries updated successfully');
  } catch (error) {
    console.error('❌ Error updating existing auto pricing:', error);
  }
};

// @desc    Get all auto vehicles
// @route   GET /api/vehicles/auto
// @access  Public
const getVehicleAuto = asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Fetching all autos from database...');
    
    // Update existing auto pricing entries to include autoPrice field
    await updateExistingAutoPricing();
    
    const allAutos = await Vehicle.find({ type: 'auto' })
      .populate({
        path: 'driver',
        select: 'firstName lastName rating phone isOnline status',
        match: { isActive: true }
      })
      .sort({ createdAt: -1 });

    console.log(`🔍 Found ${allAutos.length} total autos in database`);

    // Filter out vehicles without drivers
    const approvalFilter = allAutos.filter(auto => auto.approvalStatus === 'approved');
    console.log(`🔍 After approval filter: ${approvalFilter.length} autos`);
    
    const availableFilter = approvalFilter.filter(auto => auto.isAvailable);
    console.log(`🔍 After available filter: ${availableFilter.length} autos`);
    
    const activeFilter = availableFilter.filter(auto => auto.isActive);
    console.log(`🔍 After active filter: ${activeFilter.length} autos`);
    
    // Handle both old and new vehicles for bookingStatus
    const bookingStatusFilter = activeFilter.filter(auto => {
      // If bookingStatus exists, check if it's 'available'
      if (auto.bookingStatus !== undefined) {
        return auto.bookingStatus === 'available';
      }
      // For old vehicles without bookingStatus, check if they're not booked
      return !auto.booked;
    });
    console.log(`🔍 After bookingStatus filter: ${bookingStatusFilter.length} autos`);
    
    const bookedFilter = bookingStatusFilter.filter(auto => !auto.booked);
    console.log(`🔍 After booked filter: ${bookedFilter.length} autos`);
    
    const availableAutos = bookedFilter.filter(auto => auto.driver);
    console.log(`🔍 Final available autos: ${availableAutos.length} autos`);

    // Debug: Log details of each filter step
    console.log('🔍 Debug - All autos details:', allAutos.map(auto => ({
      id: auto._id,
      brand: auto.brand,
      model: auto.model,
      approvalStatus: auto.approvalStatus,
      isAvailable: auto.isAvailable,
      isActive: auto.isActive,
      bookingStatus: auto.bookingStatus,
      booked: auto.booked,
      hasDriver: !!auto.driver
    })));

    // Populate computed pricing for each auto
    const VehiclePricing = require('../models/VehiclePricing');
    
    // Debug: Check what pricing entries exist for auto vehicles
    try {
      const allAutoPricing = await VehiclePricing.find({ category: 'auto', isActive: true });
      console.log(`🔍 Found ${allAutoPricing.length} auto pricing entries in database:`, allAutoPricing.map(p => ({
        id: p._id,
        vehicleType: p.vehicleType,
        vehicleModel: p.vehicleModel,
        basePrice: p.basePrice
      })));
      
      // If no auto pricing exists, create default entries
      if (allAutoPricing.length === 0) {
        console.log('🚨 No auto pricing entries found. Creating default pricing...');
        await createDefaultAutoPricing();
        console.log('✅ Default auto pricing created successfully');
      }
    } catch (pricingError) {
      console.error('❌ Error checking auto pricing entries:', pricingError);
    }
    
    const autosWithPricing = await Promise.all(
      availableAutos.map(async (auto) => {
        try {
          console.log(`🔍 Processing auto ${auto._id}:`, {
            pricingReference: auto.pricingReference,
            hasPricingRef: !!auto.pricingReference
          });
          
          if (auto.pricingReference) {
            console.log(`🔍 Looking up pricing for auto ${auto._id}:`, {
              category: auto.pricingReference.category,
              vehicleType: auto.pricingReference.vehicleType,
              vehicleModel: auto.pricingReference.vehicleModel
            });
            
            // Validate pricingReference structure
            if (!auto.pricingReference.category || !auto.pricingReference.vehicleType || !auto.pricingReference.vehicleModel) {
              console.log(`⚠️ Auto ${auto._id} has incomplete pricingReference:`, auto.pricingReference);
            }
            
            const pricing = await VehiclePricing.getPricing(
              auto.pricingReference.category,
              auto.pricingReference.vehicleType,
              auto.pricingReference.vehicleModel,
              'one-way'
            );
            
            console.log(`🔍 Pricing lookup result for auto ${auto._id}:`, pricing);
            
            if (pricing) {
              // Add computed pricing to the auto object
              auto.computedPricing = {
                basePrice: pricing.basePrice,
                distancePricing: pricing.distancePricing,
                category: pricing.category,
                vehicleType: pricing.vehicleType,
                vehicleModel: pricing.vehicleModel
              };
              console.log(`✅ Added computed pricing for auto ${auto._id}:`, auto.computedPricing);
            } else {
              console.log(`❌ No pricing found for auto ${auto._id}`);
              
              // Try to get default pricing for auto category
              try {
                const defaultPricing = await VehiclePricing.getDefaultPricing('auto', auto.pricingReference.vehicleType, 'one-way');
                if (defaultPricing) {
                  auto.computedPricing = {
                    basePrice: defaultPricing.basePrice,
                    distancePricing: defaultPricing.distancePricing,
                    category: defaultPricing.category,
                    vehicleType: defaultPricing.vehicleType,
                    vehicleModel: defaultPricing.vehicleModel
                  };
                  console.log(`✅ Using default pricing for auto ${auto._id}:`, auto.computedPricing);
                } else {
                  console.log(`❌ No default pricing found for auto ${auto._id}`);
                  
                  // Create default pricing for this auto if none exists
                  const createdPricing = await createPricingForAuto(auto.pricingReference);
                  if (createdPricing) {
                    auto.computedPricing = {
                      basePrice: createdPricing.basePrice,
                      distancePricing: createdPricing.distancePricing,
                      category: createdPricing.category,
                      vehicleType: createdPricing.vehicleType,
                      vehicleModel: createdPricing.vehicleModel
                    };
                    console.log(`✅ Created and using default pricing for auto ${auto._id}:`, auto.computedPricing);
                  }
                }
              } catch (defaultError) {
                console.error(`❌ Error fetching default pricing for auto ${auto._id}:`, defaultError);
                
                // Final fallback: create default pricing
                try {
                  const createdPricing = await createPricingForAuto(auto.pricingReference);
                  if (createdPricing) {
                    auto.computedPricing = {
                      basePrice: createdPricing.basePrice,
                      distancePricing: createdPricing.distancePricing,
                      category: createdPricing.category,
                      vehicleType: createdPricing.vehicleType,
                      vehicleModel: createdPricing.vehicleModel
                    };
                    console.log(`✅ Created fallback pricing for auto ${auto._id}:`, auto.computedPricing);
                  }
                } catch (createError) {
                  console.error(`❌ Failed to create fallback pricing for auto ${auto._id}:`, createError);
                }
              }
            }
          } else {
            console.log(`❌ Auto ${auto._id} has no pricingReference`);
            
            // Try to get any available pricing for auto category
            try {
              const anyAutoPricing = await VehiclePricing.findOne({
                category: 'auto',
                isActive: true
              });
              
              if (anyAutoPricing) {
                auto.computedPricing = {
                  basePrice: anyAutoPricing.basePrice,
                  distancePricing: anyAutoPricing.distancePricing,
                  category: anyAutoPricing.category,
                  vehicleType: anyAutoPricing.vehicleType,
                  vehicleModel: anyAutoPricing.vehicleModel
                };
                console.log(`✅ Using available auto pricing for auto ${auto._id}:`, auto.computedPricing);
              } else {
                console.log(`❌ No auto pricing entries found in database`);
                
                // Create default pricing for auto category
                const defaultPricing = await createDefaultAutoPricing();
                if (defaultPricing) {
                  auto.computedPricing = {
                    basePrice: defaultPricing.basePrice,
                    distancePricing: defaultPricing.distancePricing,
                    category: defaultPricing.category,
                    vehicleType: defaultPricing.vehicleType,
                    vehicleModel: defaultPricing.vehicleModel
                  };
                  console.log(`✅ Using newly created default pricing for auto ${auto._id}:`, auto.computedPricing);
                }
              }
            } catch (anyPricingError) {
              console.error(`❌ Error fetching any auto pricing:`, anyPricingError);
              
              // Final fallback: create default pricing
              try {
                const defaultPricing = await createDefaultAutoPricing();
                if (defaultPricing) {
                  auto.computedPricing = {
                    basePrice: defaultPricing.basePrice,
                    distancePricing: defaultPricing.distancePricing,
                    category: defaultPricing.category,
                    vehicleType: defaultPricing.vehicleType,
                    vehicleModel: defaultPricing.vehicleModel
                  };
                  console.log(`✅ Using emergency fallback pricing for auto ${auto._id}:`, auto.computedPricing);
                }
              } catch (createError) {
                console.error(`❌ Failed to create emergency fallback pricing:`, createError);
              }
            }
          }
          return auto;
        } catch (error) {
          console.error(`❌ Error fetching pricing for auto ${auto._id}:`, error);
          return auto;
        }
      })
    );

    res.status(200).json({
      success: true,
      count: autosWithPricing.length,
      data: autosWithPricing,
      debug: {
        totalAutos: allAutos.length,
        approvedAutos: approvalFilter.length,
        availableAutos: availableFilter.length,
        activeAutos: activeFilter.length,
        finalAutos: autosWithPricing.length
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

// Helper function to create default pricing for auto vehicles
const createDefaultAutoPricing = async () => {
  try {
    const VehiclePricing = require('../models/VehiclePricing');
    const Admin = require('../models/Admin');
    
    // Get the first admin user to use as createdBy
    const admin = await Admin.findOne({ isActive: true });
    if (!admin) {
      console.error('❌ No admin user found to create default pricing');
      return null;
    }
    
    // Default auto pricing configurations
    const defaultPricingData = [
      {
        category: 'auto',
        vehicleType: 'Auto',
        vehicleModel: 'CNG',
        tripType: 'one-way',
        autoPrice: 80, // Per kilometer rate
        basePrice: 80, // For backward compatibility
        distancePricing: { '50km': 0, '100km': 0, '150km': 0, '200km': 0 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default CNG auto pricing (one-way)'
      },
      {
        category: 'auto',
        vehicleType: 'Auto',
        vehicleModel: 'CNG',
        tripType: 'return',
        autoPrice: 120, // Per kilometer rate (1.5x one-way)
        basePrice: 120, // For backward compatibility
        distancePricing: { '50km': 0, '100km': 0, '150km': 0, '200km': 0 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default CNG auto pricing (return)'
      },
      {
        category: 'auto',
        vehicleType: 'Auto',
        vehicleModel: 'Petrol',
        tripType: 'one-way',
        autoPrice: 100, // Per kilometer rate
        basePrice: 100, // For backward compatibility
        distancePricing: { '50km': 0, '100km': 0, '150km': 0, '200km': 0 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default Petrol auto pricing (one-way)'
      },
      {
        category: 'auto',
        vehicleType: 'Auto',
        vehicleModel: 'Petrol',
        tripType: 'return',
        autoPrice: 150, // Per kilometer rate (1.5x one-way)
        basePrice: 150, // For backward compatibility
        distancePricing: { '50km': 0, '100km': 0, '150km': 0, '200km': 0 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default Petrol auto pricing (return)'
      },
      {
        category: 'auto',
        vehicleType: 'Auto',
        vehicleModel: 'Electric',
        tripType: 'one-way',
        autoPrice: 120, // Per kilometer rate
        basePrice: 120, // For backward compatibility
        distancePricing: { '50km': 0, '100km': 0, '150km': 0, '200km': 0 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default Electric auto pricing (one-way)'
      },
      {
        category: 'auto',
        vehicleType: 'Auto',
        vehicleModel: 'Electric',
        tripType: 'return',
        autoPrice: 180, // Per kilometer rate (1.5x one-way)
        basePrice: 180, // For backward compatibility
        distancePricing: { '50km': 0, '100km': 0, '150km': 0, '200km': 0 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default Electric auto pricing (return)'
      },
      {
        category: 'auto',
        vehicleType: 'Auto',
        vehicleModel: 'Diesel',
        tripType: 'one-way',
        autoPrice: 90, // Per kilometer rate
        basePrice: 90, // For backward compatibility
        distancePricing: { '50km': 0, '100km': 0, '150km': 0, '200km': 0 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default Diesel auto pricing (one-way)'
      },
      {
        category: 'auto',
        vehicleType: 'Auto',
        vehicleModel: 'Diesel',
        tripType: 'return',
        autoPrice: 135, // Per kilometer rate (1.5x one-way)
        basePrice: 135, // For backward compatibility
        distancePricing: { '50km': 0, '100km': 0, '150km': 0, '200km': 0 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default Diesel auto pricing (return)'
      }
    ];
    
    // Create all default pricing entries
    const createdPricing = await VehiclePricing.insertMany(defaultPricingData);
    console.log(`✅ Created ${createdPricing.length} default auto pricing entries`);
    
    return createdPricing[0]; // Return first one as default
  } catch (error) {
    console.error('❌ Error creating default auto pricing:', error);
    return null;
  }
};

// Helper function to create pricing for a specific auto vehicle
const createPricingForAuto = async (pricingReference) => {
  try {
    const VehiclePricing = require('../models/VehiclePricing');
    const Admin = require('../models/Admin');
    
    // Get the first admin user to use as createdBy
    const admin = await Admin.findOne({ isActive: true });
    if (!admin) {
      console.error('❌ No admin user found to create auto pricing');
      return null;
    }
    
    // Create pricing based on the auto's fuel type
    const basePrice = getBasePriceForFuelType(pricingReference.vehicleModel);
    
    // Create both one-way and return pricing entries
    const pricingData = [
      {
        category: pricingReference.category,
        vehicleType: pricingReference.vehicleType,
        vehicleModel: pricingReference.vehicleModel,
        tripType: 'one-way',
        autoPrice: basePrice, // Per kilometer rate for one-way
        distancePricing: { '50km': 0, '100km': 0, '150km': 0, '200km': 0 },
        isActive: true,
        isDefault: false,
        createdBy: admin._id,
        notes: `Auto-generated one-way pricing for ${pricingReference.vehicleModel} auto`
      },
      {
        category: pricingReference.category,
        vehicleType: pricingReference.vehicleType,
        vehicleModel: pricingReference.vehicleModel,
        tripType: 'return',
        autoPrice: Math.round(basePrice * 1.5), // Return trip is 1.5x one-way rate
        distancePricing: { '50km': 0, '100km': 0, '150km': 0, '200km': 0 },
        isActive: true,
        isDefault: false,
        createdBy: admin._id,
        notes: `Auto-generated return pricing for ${pricingReference.vehicleModel} auto`
      }
    ];
    
    const createdPricing = await VehiclePricing.insertMany(pricingData);
    console.log(`✅ Created pricing for auto ${pricingReference.vehicleModel}:`, createdPricing);
    
    return createdPricing[0]; // Return first one as default
  } catch (error) {
    console.error('❌ Error creating pricing for auto:', error);
    return null;
  }
};

// Helper function to get base price based on fuel type
const getBasePriceForFuelType = (fuelType) => {
  const fuelTypePrices = {
    'CNG': 80,
    'Petrol': 100,
    'Electric': 120,
    'Diesel': 90
  };
  
  return fuelTypePrices[fuelType] || 80; // Default to CNG price if fuel type not found
};

// Helper function to create default pricing for car vehicles
const createDefaultCarPricing = async () => {
  try {
    const VehiclePricing = require('../models/VehiclePricing');
    const Admin = require('../models/Admin');
    
    // Get the first admin user to use as createdBy
    const admin = await Admin.findOne({ isActive: true });
    if (!admin) {
      console.error('❌ No admin user found to create default pricing');
      return null;
    }
    
    // Default car pricing configurations
    const defaultPricingData = [
      {
        category: 'car',
        vehicleType: 'Sedan',
        vehicleModel: 'Honda Amaze',
        tripType: 'one-way',
        basePrice: 200,
        distancePricing: { '50km': 12, '100km': 10, '150km': 8, '200km': 6 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default Sedan pricing'
      },
      {
        category: 'car',
        vehicleType: 'Hatchback',
        vehicleModel: 'Swift',
        tripType: 'one-way',
        basePrice: 180,
        distancePricing: { '50km': 10, '100km': 8, '150km': 6, '200km': 5 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default Hatchback pricing'
      },
      {
        category: 'car',
        vehicleType: 'SUV',
        vehicleModel: 'Innova Crysta',
        tripType: 'one-way',
        basePrice: 300,
        distancePricing: { '50km': 15, '100km': 12, '150km': 10, '200km': 8 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default SUV pricing'
      }
    ];
    
    // Create all default pricing entries
    const createdPricing = await VehiclePricing.insertMany(defaultPricingData);
    console.log(`✅ Created ${createdPricing.length} default car pricing entries`);
    
    return createdPricing[0]; // Return first one as default
  } catch (error) {
    console.error('❌ Error creating default car pricing:', error);
    return null;
  }
};

// Helper function to create pricing for a specific car vehicle
const createPricingForCar = async (pricingReference) => {
  try {
    const VehiclePricing = require('../models/VehiclePricing');
    const Admin = require('../models/Admin');
    
    // Get the first admin user to use as createdBy
    const admin = await Admin.findOne({ isActive: true });
    if (!admin) {
      console.error('❌ No admin user found to create car pricing');
      return null;
    }
    
    // Create pricing based on the car's type and model
    const basePrice = getBasePriceForCarType(pricingReference.vehicleType);
    const distancePricing = getDistancePricingForCarType(pricingReference.vehicleType);
    
    const pricingData = {
      category: pricingReference.category,
      vehicleType: pricingReference.vehicleType,
      vehicleModel: pricingReference.vehicleModel,
      tripType: 'one-way',
      basePrice: basePrice,
      distancePricing: distancePricing,
      isActive: true,
      isDefault: false,
      createdBy: admin._id,
      notes: `Auto-generated pricing for ${pricingReference.vehicleModel} ${pricingReference.vehicleType}`
    };
    
    const createdPricing = await VehiclePricing.create(pricingData);
    console.log(`✅ Created pricing for car ${pricingReference.vehicleModel}:`, createdPricing);
    
    return createdPricing;
  } catch (error) {
    console.error('❌ Error creating pricing for car:', error);
    return null;
  }
};

// Helper function to get base price based on car type
const getBasePriceForCarType = (vehicleType) => {
  const carTypePrices = {
    'Sedan': 200,
    'Hatchback': 180,
    'SUV': 300
  };
  
  return carTypePrices[vehicleType] || 200; // Default to Sedan price if type not found
};

// Helper function to get distance pricing based on car type
const getDistancePricingForCarType = (vehicleType) => {
  const carTypeDistancePricing = {
    'Sedan': { '50km': 12, '100km': 10, '150km': 8, '200km': 6 },
    'Hatchback': { '50km': 10, '100km': 8, '150km': 6, '200km': 5 },
    'SUV': { '50km': 15, '100km': 12, '150km': 10, '200km': 8 }
  };
  
  return carTypeDistancePricing[vehicleType] || { '50km': 12, '100km': 10, '150km': 8, '200km': 6 };
};

// Helper function to create default pricing for bus vehicles
const createDefaultBusPricing = async () => {
  try {
    const VehiclePricing = require('../models/VehiclePricing');
    const Admin = require('../models/Admin');
    
    // Get the first admin user to use as createdBy
    const admin = await Admin.findOne({ isActive: true });
    if (!admin) {
      console.error('❌ No admin user found to create default pricing');
      return null;
    }
    
    // Default bus pricing configurations
    const defaultPricingData = [
      {
        category: 'bus',
        vehicleType: 'Mini Bus',
        vehicleModel: 'Tempo Traveller',
        tripType: 'one-way',
        basePrice: 500,
        distancePricing: { '50km': 25, '100km': 20, '150km': 18, '200km': 15 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default Mini Bus pricing'
      },
      {
        category: 'bus',
        vehicleType: 'Luxury Bus',
        vehicleModel: 'Volvo AC',
        tripType: 'one-way',
        basePrice: 800,
        distancePricing: { '50km': 35, '100km': 30, '150km': 25, '200km': 20 },
        isActive: true,
        isDefault: true,
        createdBy: admin._id,
        notes: 'Default Luxury Bus pricing'
      }
    ];
    
    // Create all default pricing entries
    const createdPricing = await VehiclePricing.insertMany(defaultPricingData);
    console.log(`✅ Created ${createdPricing.length} default bus pricing entries`);
    
    return createdPricing[0]; // Return first one as default
  } catch (error) {
    console.error('❌ Error creating default bus pricing:', error);
    return null;
  }
};

// Helper function to create pricing for a specific bus vehicle
const createPricingForBus = async (pricingReference) => {
  try {
    const VehiclePricing = require('../models/VehiclePricing');
    const Admin = require('../models/Admin');
    
    // Get the first admin user to use as createdBy
    const admin = await Admin.findOne({ isActive: true });
    if (!admin) {
      console.error('❌ No admin user found to create bus pricing');
      return null;
    }
    
    // Create pricing based on the bus's type and model
    const basePrice = getBasePriceForBusType(pricingReference.vehicleType);
    const distancePricing = getDistancePricingForBusType(pricingReference.vehicleType);
    
    const pricingData = {
      category: pricingReference.category,
      vehicleType: pricingReference.vehicleType,
      vehicleModel: pricingReference.vehicleModel,
      tripType: 'one-way',
      basePrice: basePrice,
      distancePricing: distancePricing,
      isActive: true,
      isDefault: false,
      createdBy: admin._id,
      notes: `Auto-generated pricing for ${pricingReference.vehicleModel} ${pricingReference.vehicleType}`
    };
    
    const createdPricing = await VehiclePricing.create(pricingData);
    console.log(`✅ Created pricing for bus ${pricingReference.vehicleModel}:`, createdPricing);
    
    return createdPricing;
  } catch (error) {
    console.error('❌ Error creating pricing for bus:', error);
    return null;
  }
};

// Helper function to get base price based on bus type
const getBasePriceForBusType = (vehicleType) => {
  const busTypePrices = {
    'Mini Bus': 500,
    'Luxury Bus': 800
  };
  
  return busTypePrices[vehicleType] || 500; // Default to Mini Bus price if type not found
};

// Helper function to get distance pricing based on bus type
const getDistancePricingForBusType = (vehicleType) => {
  const busTypeDistancePricing = {
    'Mini Bus': { '50km': 25, '100km': 20, '150km': 18, '200km': 15 },
    'Luxury Bus': { '50km': 35, '100km': 30, '150km': 25, '200km': 20 }
  };
  
  return busTypeDistancePricing[vehicleType] || { '50km': 25, '100km': 20, '150km': 18, '200km': 15 };
};

// @desc    Get all car vehicles
// @route   GET /api/vehicles/car
// @access  Public
const getVehicleCar = asyncHandler(async (req, res) => {
  try {
    const cars = await Vehicle.find({ 
      type: 'car',
      approvalStatus: 'approved',
      isAvailable: true,
      isActive: true,
      $or: [
        { bookingStatus: 'available' },
        { bookingStatus: { $exists: false }, booked: false }
      ],
      booked: false
    })
      .populate({
        path: 'driver',
        select: 'firstName lastName rating phone isOnline status',
        match: { isActive: true }
      })
      .sort({ createdAt: -1 });

    // Filter out vehicles without drivers
    const availableCars = cars.filter(car => car.driver);

    // Populate computed pricing for each car
    const VehiclePricing = require('../models/VehiclePricing');
    
    // Debug: Check what pricing entries exist for car vehicles
    try {
      const allCarPricing = await VehiclePricing.find({ category: 'car', isActive: true });
      console.log(`🔍 Found ${allCarPricing.length} car pricing entries in database:`, allCarPricing.map(p => ({
        id: p._id,
        vehicleType: p.vehicleType,
        vehicleModel: p.vehicleModel,
        basePrice: p.basePrice
      })));
      
      // If no car pricing exists, create default entries
      if (allCarPricing.length === 0) {
        console.log('🚨 No car pricing entries found. Creating default pricing...');
        await createDefaultCarPricing();
        console.log('✅ Default car pricing created successfully');
      }
    } catch (pricingError) {
      console.error('❌ Error checking car pricing entries:', pricingError);
    }
    
    const carsWithPricing = await Promise.all(
      availableCars.map(async (car) => {
        try {
          if (car.pricingReference) {
            const pricing = await VehiclePricing.getPricing(
              car.pricingReference.category,
              car.pricingReference.vehicleType,
              car.pricingReference.vehicleModel,
              'one-way'
            );
            
            if (pricing) {
              // Add computed pricing to the car object
              car.computedPricing = {
                basePrice: pricing.basePrice,
                distancePricing: pricing.distancePricing,
                category: pricing.category,
                vehicleType: pricing.vehicleType,
                vehicleModel: pricing.vehicleModel
              };
              console.log(`✅ Added computed pricing for car ${car._id}:`, car.computedPricing);
            } else {
              console.log(`❌ No pricing found for car ${car._id}`);
              
              // Try to get default pricing for car category
              try {
                const defaultPricing = await VehiclePricing.getDefaultPricing('car', car.pricingReference.vehicleType, 'one-way');
                if (defaultPricing) {
                  car.computedPricing = {
                    basePrice: defaultPricing.basePrice,
                    distancePricing: defaultPricing.distancePricing,
                    category: defaultPricing.category,
                    vehicleType: defaultPricing.vehicleType,
                    vehicleModel: defaultPricing.vehicleModel
                  };
                  console.log(`✅ Using default pricing for car ${car._id}:`, car.computedPricing);
                } else {
                  console.log(`❌ No default pricing found for car ${car._id}`);
                  
                  // Create default pricing for this car if none exists
                  const createdPricing = await createPricingForCar(car.pricingReference);
                  if (createdPricing) {
                    car.computedPricing = {
                      basePrice: createdPricing.basePrice,
                      distancePricing: createdPricing.distancePricing,
                      category: createdPricing.category,
                      vehicleType: createdPricing.vehicleType,
                      vehicleModel: createdPricing.vehicleModel
                    };
                    console.log(`✅ Created and using default pricing for car ${car._id}:`, car.computedPricing);
                  }
                }
              } catch (defaultError) {
                console.error(`❌ Error fetching default pricing for car ${car._id}:`, defaultError);
                
                // Final fallback: create default pricing
                try {
                  const createdPricing = await createPricingForCar(car.pricingReference);
                  if (createdPricing) {
                    car.computedPricing = {
                      basePrice: createdPricing.basePrice,
                      distancePricing: createdPricing.distancePricing,
                      category: createdPricing.category,
                      vehicleType: createdPricing.vehicleType,
                      vehicleModel: createdPricing.vehicleModel
                    };
                    console.log(`✅ Created fallback pricing for car ${car._id}:`, car.computedPricing);
                  }
                } catch (createError) {
                  console.error(`❌ Failed to create fallback pricing for car ${car._id}:`, createError);
                }
              }
            }
          } else {
            console.log(`❌ Car ${car._id} has no pricingReference`);
            
            // Try to get any available pricing for car category
            try {
              const anyCarPricing = await VehiclePricing.findOne({
                category: 'car',
                isActive: true
              });
              
              if (anyCarPricing) {
                car.computedPricing = {
                  basePrice: anyCarPricing.basePrice,
                  distancePricing: anyCarPricing.distancePricing,
                  category: anyCarPricing.category,
                  vehicleType: anyCarPricing.vehicleType,
                  vehicleModel: anyCarPricing.vehicleModel
                };
                console.log(`✅ Using available car pricing for car ${car._id}:`, car.computedPricing);
              } else {
                console.log(`❌ No car pricing entries found in database`);
                
                // Create default pricing for car category
                const defaultPricing = await createDefaultCarPricing();
                if (defaultPricing) {
                  car.computedPricing = {
                    basePrice: defaultPricing.basePrice,
                    distancePricing: defaultPricing.distancePricing,
                    category: defaultPricing.category,
                    vehicleType: defaultPricing.vehicleType,
                    vehicleModel: defaultPricing.vehicleModel
                  };
                  console.log(`✅ Using newly created default pricing for car ${car._id}:`, car.computedPricing);
                }
              }
            } catch (anyPricingError) {
              console.error(`❌ Error fetching any car pricing:`, anyPricingError);
              
              // Final fallback: create default pricing
              try {
                const defaultPricing = await createDefaultCarPricing();
                if (defaultPricing) {
                  car.computedPricing = {
                    basePrice: defaultPricing.basePrice,
                    distancePricing: defaultPricing.distancePricing,
                    category: defaultPricing.category,
                    vehicleType: defaultPricing.vehicleType,
                    vehicleModel: defaultPricing.vehicleModel
                  };
                  console.log(`✅ Using emergency fallback pricing for car ${car._id}:`, car.computedPricing);
                }
              } catch (createError) {
                console.error(`❌ Failed to create emergency fallback pricing:`, createError);
              }
            }
          }
          return car;
        } catch (error) {
          console.error(`❌ Error fetching pricing for car ${car._id}:`, error);
          return car;
        }
      })
    );

    res.status(200).json({
      success: true,
      count: carsWithPricing.length,
      data: carsWithPricing
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
        avgRating: { $avg: '$rating' }
      }
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        avgRating: { $round: ['$avgRating', 1] }
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
    .sort({ rating: -1 });

  // Filter out vehicles without available drivers
  const availableVehicles = vehicles.filter(vehicle => vehicle.driver);

  // Populate computed pricing for each vehicle
  const VehiclePricing = require('../models/VehiclePricing');
  
  // Debug: Check what pricing entries exist for vehicles
  try {
    const allPricing = await VehiclePricing.find({ isActive: true });
    console.log(`🔍 Found ${allPricing.length} total pricing entries in database for nearby search`);
    
    // If no pricing exists for any category, create default entries
    if (allPricing.length === 0) {
      console.log('🚨 No pricing entries found for nearby search. Creating default pricing...');
      await createDefaultAutoPricing();
      await createDefaultCarPricing();
      await createDefaultBusPricing();
      console.log('✅ Default pricing created successfully for nearby search');
    }
  } catch (pricingError) {
    console.error('❌ Error checking pricing entries for nearby search:', pricingError);
  }
  
  const vehiclesWithPricing = await Promise.all(
    availableVehicles.map(async (vehicle) => {
      try {
        if (vehicle.pricingReference) {
          const pricing = await VehiclePricing.getPricing(
            vehicle.pricingReference.category,
            vehicle.pricingReference.vehicleType,
            vehicle.pricingReference.vehicleModel,
            'one-way'
          );
          
          if (pricing) {
            // Add computed pricing to the vehicle object
            vehicle.computedPricing = {
              basePrice: pricing.basePrice,
              distancePricing: pricing.distancePricing,
              category: pricing.category,
              vehicleType: pricing.vehicleType,
              vehicleModel: pricing.vehicleModel
            };
            console.log(`✅ Added computed pricing for nearby vehicle ${vehicle._id}:`, vehicle.computedPricing);
          } else {
            console.log(`❌ No pricing found for nearby vehicle ${vehicle._id}`);
            
            // Try to get default pricing for this vehicle category
            try {
              const defaultPricing = await VehiclePricing.getDefaultPricing(vehicle.pricingReference.category, vehicle.pricingReference.vehicleType, 'one-way');
              if (defaultPricing) {
                vehicle.computedPricing = {
                  basePrice: defaultPricing.basePrice,
                  distancePricing: defaultPricing.distancePricing,
                  category: defaultPricing.category,
                  vehicleType: defaultPricing.vehicleType,
                  vehicleModel: defaultPricing.vehicleModel
                };
                console.log(`✅ Using default pricing for nearby vehicle ${vehicle._id}:`, vehicle.computedPricing);
              } else {
                console.log(`❌ No default pricing found for nearby vehicle ${vehicle._id}`);
                
                // Create default pricing for this vehicle if none exists
                let createdPricing = null;
                if (vehicle.pricingReference.category === 'auto') {
                  createdPricing = await createPricingForAuto(vehicle.pricingReference);
                } else if (vehicle.pricingReference.category === 'car') {
                  createdPricing = await createPricingForCar(vehicle.pricingReference);
                } else if (vehicle.pricingReference.category === 'bus') {
                  createdPricing = await createPricingForBus(vehicle.pricingReference);
                }
                
                if (createdPricing) {
                  vehicle.computedPricing = {
                    basePrice: createdPricing.basePrice,
                    distancePricing: createdPricing.distancePricing,
                    category: createdPricing.category,
                    vehicleType: createdPricing.vehicleType,
                    vehicleModel: createdPricing.vehicleModel
                  };
                  console.log(`✅ Created and using default pricing for nearby vehicle ${vehicle._id}:`, vehicle.computedPricing);
                }
              }
            } catch (defaultError) {
              console.error(`❌ Error fetching default pricing for nearby vehicle ${vehicle._id}:`, defaultError);
              
              // Final fallback: create default pricing
              try {
                let createdPricing = null;
                if (vehicle.pricingReference.category === 'auto') {
                  createdPricing = await createPricingForAuto(vehicle.pricingReference);
                } else if (vehicle.pricingReference.category === 'car') {
                  createdPricing = await createPricingForCar(vehicle.pricingReference);
                } else if (vehicle.pricingReference.category === 'bus') {
                  createdPricing = await createPricingForBus(vehicle.pricingReference);
                }
                
                if (createdPricing) {
                  vehicle.computedPricing = {
                    basePrice: createdPricing.basePrice,
                    distancePricing: createdPricing.distancePricing,
                    category: createdPricing.category,
                    vehicleType: createdPricing.vehicleType,
                    vehicleModel: createdPricing.vehicleModel
                  };
                  console.log(`✅ Created fallback pricing for nearby vehicle ${vehicle._id}:`, vehicle.computedPricing);
                }
              } catch (createError) {
                console.error(`❌ Failed to create fallback pricing for nearby vehicle ${vehicle._id}:`, createError);
              }
            }
          }
        } else {
          console.log(`❌ Nearby vehicle ${vehicle._id} has no pricingReference`);
          
          // Try to get any available pricing for this vehicle type
          try {
            const anyPricing = await VehiclePricing.findOne({
              category: vehicle.type,
              isActive: true
            });
            
            if (anyPricing) {
              vehicle.computedPricing = {
                basePrice: anyPricing.basePrice,
                distancePricing: anyPricing.distancePricing,
                category: anyPricing.category,
                vehicleType: anyPricing.vehicleType,
                vehicleModel: anyPricing.vehicleModel
              };
              console.log(`✅ Using available pricing for nearby vehicle ${vehicle._id}:`, vehicle.computedPricing);
            } else {
              console.log(`❌ No pricing entries found for nearby vehicle type ${vehicle.type}`);
              
              // Create default pricing for this vehicle type
              let defaultPricing = null;
              if (vehicle.type === 'auto') {
                defaultPricing = await createDefaultAutoPricing();
              } else if (vehicle.type === 'car') {
                defaultPricing = await createDefaultCarPricing();
              } else if (vehicle.type === 'bus') {
                defaultPricing = await createDefaultBusPricing();
              }
              
              if (defaultPricing) {
                vehicle.computedPricing = {
                  basePrice: defaultPricing.basePrice,
                  distancePricing: defaultPricing.distancePricing,
                  category: defaultPricing.category,
                  vehicleType: defaultPricing.vehicleType,
                  vehicleModel: defaultPricing.vehicleModel
                };
                console.log(`✅ Using newly created default pricing for nearby vehicle ${vehicle._id}:`, vehicle.computedPricing);
              }
            }
          } catch (anyPricingError) {
            console.error(`❌ Error fetching any pricing for nearby vehicle ${vehicle._id}:`, anyPricingError);
            
            // Final fallback: create default pricing
            try {
              let defaultPricing = null;
              if (vehicle.type === 'auto') {
                defaultPricing = await createDefaultAutoPricing();
              } else if (vehicle.type === 'car') {
                defaultPricing = await createDefaultCarPricing();
              } else if (vehicle.type === 'bus') {
                defaultPricing = await createDefaultBusPricing();
              }
              
              if (defaultPricing) {
                vehicle.computedPricing = {
                  basePrice: defaultPricing.basePrice,
                  distancePricing: defaultPricing.distancePricing,
                  category: defaultPricing.category,
                  vehicleType: defaultPricing.vehicleType,
                  vehicleModel: defaultPricing.vehicleModel
                };
                console.log(`✅ Using emergency fallback pricing for nearby vehicle ${vehicle._id}:`, vehicle.computedPricing);
              }
            } catch (createError) {
              console.error(`❌ Failed to create emergency fallback pricing for nearby vehicle:`, createError);
            }
          }
        }
        return vehicle;
      } catch (error) {
        console.error(`❌ Error fetching pricing for nearby vehicle ${vehicle._id}:`, error);
        return vehicle;
      }
    })
  );

  res.json({
    success: true,
    data: vehiclesWithPricing
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
  
  // Use the new calculateFare method from the Vehicle model
  let totalFare;
  try {
    totalFare = await vehicle.calculateFare(distance, false, false, 0);
  } catch (error) {
    console.error('Error calculating fare:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating fare'
    });
  }
  
  // Add taxes
  const taxes = totalFare * 0.18; // 18% GST
  const finalTotal = totalFare + taxes;

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
        baseFare: totalFare,
        totalFare: finalTotal.toFixed(2),
        taxes: taxes.toFixed(2)
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

// @desc    Update vehicle availability (driver only)
// @route   PUT /api/vehicles/:id/availability
// @access  Private (Driver)
const updateVehicleAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isAvailable, reason, maintenanceReason } = req.body;

  // Find vehicle and ensure driver owns it
  const vehicle = await Vehicle.findOne({
    _id: id,
    driver: req.driver.id
  });

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found or you do not have permission to update it'
    });
  }

  // Check if vehicle has active bookings
  if (vehicle.currentBooking) {
    const activeBooking = await Booking.findById(vehicle.currentBooking);
    if (activeBooking && ['accepted', 'started'].includes(activeBooking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change availability while vehicle has an active trip'
      });
    }
  }

  // Update vehicle availability based on the request
  if (isAvailable === false) {
    if (maintenanceReason) {
      await vehicle.markAsUnderMaintenance(maintenanceReason);
    } else {
      await vehicle.markAsOffline();
    }
  } else {
    // Mark as available only if no active bookings
    if (!vehicle.currentBooking || vehicle.bookingStatus === 'available') {
      await vehicle.markAsAvailable();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vehicle has active bookings and cannot be marked as available'
      });
    }
  }

  res.json({
    success: true,
    message: 'Vehicle availability updated successfully',
    data: {
      _id: vehicle._id,
      isAvailable: vehicle.isAvailable,
      bookingStatus: vehicle.bookingStatus,
      lastStatusUpdate: vehicle.lastStatusUpdate
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

// @desc    Get vehicle status overview (driver only)
// @route   GET /api/vehicles/:id/status
// @access  Private (Driver)
const getVehicleStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find vehicle and ensure driver owns it
  const vehicle = await Vehicle.findOne({
    _id: id,
    driver: req.driver.id
  }).populate('currentBooking');

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found or you do not have permission to view it'
    });
  }

  // Get current booking details if exists
  let currentTripInfo = null;
  if (vehicle.currentBooking) {
    const booking = await Booking.findById(vehicle.currentBooking)
      .populate('user', 'firstName lastName phone');
    
    if (booking) {
      currentTripInfo = {
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        user: booking.user,
        pickup: booking.tripDetails.pickup,
        destination: booking.tripDetails.destination,
        date: booking.tripDetails.date,
        time: booking.tripDetails.time,
        totalAmount: booking.pricing.totalAmount
      };
    }
  }

  res.json({
    success: true,
    data: {
      _id: vehicle._id,
      type: vehicle.type,
      brand: vehicle.brand,
      model: vehicle.model,
      registrationNumber: vehicle.registrationNumber,
      isAvailable: vehicle.isAvailable,
      bookingStatus: vehicle.bookingStatus,
      lastStatusUpdate: vehicle.lastStatusUpdate,
      currentTrip: currentTripInfo,
      maintenance: {
        isUnderMaintenance: vehicle.maintenance.isUnderMaintenance,
        maintenanceReason: vehicle.maintenance.maintenanceReason,
        lastService: vehicle.maintenance.lastService,
        nextService: vehicle.maintenance.nextService
      }
    }
  });
});

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
  getVehicleCar,
  getVehicleStatus
};
