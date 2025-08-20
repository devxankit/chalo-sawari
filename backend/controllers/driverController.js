const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const { sendEmail } = require('../utils/notifications');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get driver profile
// @route   GET /api/driver/profile
// @access  Private (Driver)
const getDriverProfile = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.driver.id)
    .select('-password');

  res.json({
    success: true,
    data: driver
  });
});

// @desc    Update driver profile
// @route   PUT /api/driver/profile
// @access  Private (Driver)
const updateDriverProfile = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    email,
    dateOfBirth,
    address,
    emergencyContact
  } = req.body;

  const driver = await Driver.findByIdAndUpdate(
    req.driver.id,
    {
      firstName,
      lastName,
      phone,
      email,
      dateOfBirth,
      address,
      emergencyContact
    },
    { new: true, runValidators: true }
  ).select('-password');

  res.json({
    success: true,
    data: driver
  });
});

// @desc    Update driver location
// @route   PUT /api/driver/location
// @access  Private (Driver)
const updateLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, address } = req.body;

  const driver = await Driver.findByIdAndUpdate(
    req.driver.id,
    {
      'location.coordinates': [longitude, latitude],
      'location.address': address,
      'location.lastUpdated': new Date()
    },
    { new: true }
  ).select('-password');

  // Note: Vehicle location is stored in driver.vehicleDetails, not as a separate reference
  // Vehicle location updates would need to be handled differently if needed

  res.json({
    success: true,
    data: driver.location
  });
});

// @desc    Toggle driver online/offline status
// @route   PUT /api/driver/status
// @access  Private (Driver)
const toggleStatus = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.driver.id);
  
  driver.availability.isOnline = !driver.availability.isOnline;
  driver.lastStatusChange = new Date();
  
  // Update vehicle availability in driver details
  if (driver.vehicleDetails) {
    driver.vehicleDetails.isAvailable = driver.availability.isOnline;
  }

  await driver.save();

  res.json({
    success: true,
    data: {
      isOnline: driver.availability.isOnline,
      lastStatusChange: driver.availability.lastStatusChange
    }
  });
});

// @desc    Get driver earnings
// @route   GET /api/driver/earnings
// @access  Private (Driver)
const getEarnings = asyncHandler(async (req, res) => {
  const { period = 'month', startDate, endDate } = req.query;
  
  let dateFilter = {};
  
  if (startDate && endDate) {
    dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  } else {
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
  }

  const bookings = await Booking.find({
    driver: req.driver.id,
    status: 'completed',
    ...dateFilter
  }).select('totalAmount commission createdAt');

  const totalEarnings = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  const totalCommission = bookings.reduce((sum, booking) => sum + booking.commission, 0);
  const netEarnings = totalEarnings - totalCommission;

  res.json({
    success: true,
    data: {
      period,
      totalBookings: bookings.length,
      totalEarnings,
      totalCommission,
      netEarnings,
      bookings: bookings.map(booking => ({
        amount: booking.totalAmount,
        commission: booking.commission,
        netAmount: booking.totalAmount - booking.commission,
        date: booking.createdAt
      }))
    }
  });
});

// @desc    Get driver bookings
// @route   GET /api/driver/bookings
// @access  Private (Driver)
const getDriverBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  const query = { driver: req.driver.id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate([
        { path: 'user', select: 'firstName lastName phone' },
        { path: 'vehicle', select: 'type brand model color' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Booking.countDocuments(query)
  ]);

  console.log('Debug - Driver fetching bookings:', {
    driverId: req.driver.id,
    driverName: req.driver.firstName,
    query: query,
    totalBookings: total,
    returnedBookings: bookings.length
  });

  res.json({
    success: true,
    data: {
      docs: bookings,
      totalDocs: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNextPage: skip + bookings.length < total,
      hasPrevPage: parseInt(page) > 1
    }
  });
});

// @desc    Update booking status
// @route   PUT /api/driver/bookings/:id/status
// @access  Private (Driver)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason, notes, actualDistance, actualDuration, actualFare, driverNotes } = req.body;

  console.log('Debug - Driver updating booking status:', {
    bookingId: id,
    newStatus: status,
    driverId: req.driver.id,
    driverName: req.driver.firstName
  });

  const booking = await Booking.findOne({
    _id: id,
    driver: req.driver.id
  });

  console.log('Debug - Booking found:', {
    found: !!booking,
    bookingId: id,
    bookingDriver: booking?.driver,
    currentStatus: booking?.status
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Validate status transition
  const validTransitions = {
    'accepted': ['pending'],
    'started': ['accepted'],
    'completed': ['started'],
    'cancelled': ['pending', 'accepted']
  };

  console.log('Debug - Status transition validation:', {
    currentStatus: booking.status,
    newStatus: status,
    validTransitions: validTransitions[status],
    isValidTransition: validTransitions[status]?.includes(booking.status)
  });

  if (!validTransitions[status] || !validTransitions[status].includes(booking.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot change status from ${booking.status} to ${status}`
    });
  }

  // Set tracking information for the pre-save middleware
  booking._updatedByModel = 'Driver';
  booking._updatedBy = req.driver.id;
  if (reason) booking._statusReason = reason;
  if (notes) booking._statusNotes = notes;

  // Update booking status
  booking.status = status;
  
  // Handle trip-specific data
  if (status === 'started') {
    // Initialize trip object if it doesn't exist
    if (!booking.trip) booking.trip = {};
    booking.trip.startTime = new Date();
  } else if (status === 'completed') {
    // Initialize trip object if it doesn't exist
    if (!booking.trip) booking.trip = {};
    booking.trip.endTime = new Date();
    booking.trip.actualDistance = actualDistance || booking.tripDetails.distance;
    booking.trip.actualDuration = actualDuration || booking.tripDetails.duration;
    booking.trip.actualFare = actualFare || booking.pricing.totalAmount;
    if (driverNotes) booking.trip.driverNotes = driverNotes;
  }

  await booking.save();

  // Vehicle status will be automatically updated by the pre-save middleware

  res.json({
    success: true,
    message: `Booking ${status} successfully`,
    data: booking
  });
});

// @desc    Complete trip
// @route   PUT /api/driver/bookings/:id/complete
// @access  Private (Driver)
const completeTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { actualDistance, actualDuration, actualFare, driverNotes } = req.body;

  console.log('Debug - Driver completing trip:', {
    bookingId: id,
    driverId: req.driver.id,
    driverName: req.driver.firstName
  });

  const booking = await Booking.findOne({
    _id: id,
    driver: req.driver.id,
    status: 'started' // Only started trips can be completed
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Active trip not found or trip is not in started status'
    });
  }

  // Set tracking information for the pre-save middleware
  booking._updatedByModel = 'Driver';
  booking._updatedBy = req.driver.id;
  if (driverNotes) booking._statusNotes = driverNotes;

  // Update booking status to completed
  booking.status = 'completed';
  
  // Update trip details
  if (!booking.trip) booking.trip = {};
  booking.trip.endTime = new Date();
  booking.trip.actualDistance = actualDistance || booking.tripDetails.distance;
  booking.trip.actualDuration = actualDuration || booking.tripDetails.duration;
  booking.trip.actualFare = actualFare || booking.pricing.totalAmount;
  if (driverNotes) booking.trip.driverNotes = driverNotes;

  await booking.save();

  // Vehicle status will be automatically updated by the pre-save middleware

  res.json({
    success: true,
    message: 'Trip completed successfully',
    data: booking
  });
});

// @desc    Cancel trip (driver)
// @route   PUT /api/driver/bookings/:id/cancel
// @access  Private (Driver)
const cancelTrip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, notes } = req.body;

  console.log('Debug - Driver cancelling trip:', {
    bookingId: id,
    driverId: req.driver.id,
    driverName: req.driver.firstName,
    reason: reason
  });

  const booking = await Booking.findOne({
    _id: id,
    driver: req.driver.id,
    status: { $in: ['pending', 'accepted'] } // Only pending or accepted trips can be cancelled by driver
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Trip not found or cannot be cancelled in current status'
    });
  }

  // Set tracking information for the pre-save middleware
  booking._updatedByModel = 'Driver';
  booking._updatedBy = req.driver.id;
  if (reason) booking._statusReason = reason;
  if (notes) booking._statusNotes = notes;

  // Update booking status to cancelled
  booking.status = 'cancelled';
  
  // Add cancellation details
  booking.cancellation = {
    cancelledBy: req.driver.id,
    cancelledByModel: 'Driver',
    cancelledAt: new Date(),
    reason: reason || 'Cancelled by driver',
    refundAmount: booking.pricing.totalAmount,
    refundStatus: 'pending'
  };

  await booking.save();

  // Vehicle status will be automatically updated by the pre-save middleware

  res.json({
    success: true,
    message: 'Trip cancelled successfully',
    data: booking
  });
});

// @desc    Get driver's active trips
// @route   GET /api/driver/trips/active
// @access  Private (Driver)
const getActiveTrips = asyncHandler(async (req, res) => {
  const activeTrips = await Booking.find({
    driver: req.driver.id,
    status: { $in: ['accepted', 'started'] }
  })
    .populate([
      { path: 'user', select: 'firstName lastName phone email' },
      { path: 'vehicle', select: 'type brand model color registrationNumber' }
    ])
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: activeTrips.length,
    data: activeTrips
  });
});

// @desc    Get driver's trip history
// @route   GET /api/driver/trips/history
// @access  Private (Driver)
const getTripHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { driver: req.driver.id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [trips, total] = await Promise.all([
    Booking.find(query)
      .populate([
        { path: 'user', select: 'firstName lastName phone email' },
        { path: 'vehicle', select: 'type brand model color registrationNumber' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Booking.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      docs: trips,
      totalDocs: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      hasNextPage: skip + trips.length < total,
      hasPrevPage: parseInt(page) > 1
    }
  });
});

// @desc    Get driver vehicle
// @route   GET /api/driver/vehicle
// @access  Private (Driver)
const getDriverVehicle = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.driver.id);
  
  if (!driver.vehicleDetails) {
    return res.status(404).json({
      success: false,
      message: 'No vehicle details found'
    });
  }

  res.json({
    success: true,
    data: driver.vehicleDetails
  });
});

// @desc    Get driver vehicles (multiple vehicles)
// @route   GET /api/driver/vehicles
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

// @desc    Create new vehicle
// @route   POST /api/driver/vehicles
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

  // Verify that the pricing exists in VehiclePricing model
  const VehiclePricing = require('../models/VehiclePricing');
  const existingPricing = await VehiclePricing.getPricing(
    pricingReference.category,
    pricingReference.vehicleType,
    pricingReference.vehicleModel,
    'one-way' // Default to one-way trip
  );

  if (!existingPricing) {
    return res.status(400).json({
      success: false,
      message: 'No pricing found for the specified vehicle configuration. Please contact admin to set up pricing.'
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
    pricingReference: {
      category: pricingReference.category,
      vehicleType: pricingReference.vehicleType,
      vehicleModel: pricingReference.vehicleModel
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

  // Manually populate pricing after vehicle creation
  try {
    if (vehicle.pricingReference) {
      console.log(`🔍 Manually populating pricing for vehicle ${vehicle._id}...`);
      console.log(`📋 Pricing reference:`, vehicle.pricingReference);
      
      const VehiclePricing = require('../models/VehiclePricing');
      
      // Fetch both one-way and return pricing
      const oneWayPricing = await VehiclePricing.getPricing(
        vehicle.pricingReference.category,
        vehicle.pricingReference.vehicleType,
        vehicle.pricingReference.vehicleModel,
        'one-way'
      );
      
      const returnPricing = await VehiclePricing.getPricing(
        vehicle.pricingReference.category,
        vehicle.pricingReference.vehicleType,
        vehicle.pricingReference.vehicleModel,
        'return'
      );
      
      console.log(`🔍 One-way pricing found:`, oneWayPricing ? 'Yes' : 'No');
      console.log(`🔍 Return pricing found:`, returnPricing ? 'Yes' : 'No');
      
      if (oneWayPricing) {
        console.log(`💰 One-way pricing data:`, {
          autoPrice: oneWayPricing.autoPrice,
          distancePricing: oneWayPricing.distancePricing
        });
      }
      
      if (returnPricing) {
        console.log(`💰 Return pricing data:`, {
          autoPrice: returnPricing.autoPrice,
          distancePricing: returnPricing.distancePricing
        });
      }
      
      if (oneWayPricing || returnPricing) {
        // Initialize pricing structure based on vehicle category
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
        
        // Populate auto pricing for auto category
        if (vehicle.pricingReference.category === 'auto') {
          if (oneWayPricing) {
            autoPrice.oneWay = oneWayPricing.autoPrice || 0;
            console.log(`🚗 Auto one-way price: ₹${autoPrice.oneWay}`);
          }
          if (returnPricing) {
            autoPrice.return = returnPricing.autoPrice || 0;
            console.log(`🚗 Auto return price: ₹${autoPrice.return}`);
          }
        } else {
          // Populate distance-based pricing for car and bus categories
          if (oneWayPricing && oneWayPricing.distancePricing) {
            distancePricing.oneWay = {
              '50km': oneWayPricing.distancePricing['50km'] || 0,
              '100km': oneWayPricing.distancePricing['100km'] || 0,
              '150km': oneWayPricing.distancePricing['150km'] || 0
            };
            console.log(`🚗 One-way distance pricing:`, distancePricing.oneWay);
          }
          if (returnPricing && returnPricing.distancePricing) {
            distancePricing.return = {
              '50km': returnPricing.distancePricing['50km'] || 0,
              '100km': returnPricing.distancePricing['100km'] || 0,
              '150km': returnPricing.distancePricing['150km'] || 0
            };
            console.log(`🚗 Return distance pricing:`, distancePricing.return);
          }
        }
        
        // Update the vehicle with pricing data
        vehicle.pricing = {
          autoPrice,
          distancePricing,
          lastUpdated: new Date()
        };
        
        console.log(`📝 Final pricing structure to save:`, vehicle.pricing);
        
        // Save the updated vehicle
        await vehicle.save();
        console.log(`✅ Pricing populated for vehicle ${vehicle._id}:`, {
          category: vehicle.pricingReference.category,
          autoPrice: vehicle.pricing.autoPrice,
          distancePricing: vehicle.pricing.distancePricing
        });
      } else {
        console.warn(`⚠️ No pricing found for ${vehicle.pricingReference.category} ${vehicle.pricingReference.vehicleType} ${vehicle.pricingReference.vehicleModel}`);
        
        // Log available pricing for debugging
        const allPricing = await VehiclePricing.find({ isActive: true });
        console.log(`📊 Available pricing records:`, allPricing.map(p => ({
          category: p.category,
          vehicleType: p.vehicleType,
          vehicleModel: p.vehicleModel,
          tripType: p.tripType
        })));
      }
    }
  } catch (pricingError) {
    console.error(`❌ Error populating pricing for vehicle ${vehicle._id}:`, pricingError.message);
    console.error(`❌ Error stack:`, pricingError.stack);
    // Continue without pricing - vehicle will still be created
  }

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

// @desc    Update vehicle details
// @route   PUT /api/driver/vehicle
// @access  Private (Driver)
const updateVehicle = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.driver.id);
  
  if (!driver.vehicleDetails) {
    return res.status(404).json({
      success: false,
      message: 'No vehicle details found'
    });
  }

  // Update vehicle details in driver document
  const updatedDriver = await Driver.findByIdAndUpdate(
    req.driver.id,
    { vehicleDetails: { ...driver.vehicleDetails, ...req.body } },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updatedDriver.vehicleDetails
  });
});

// @desc    Update specific vehicle by ID
// @route   PUT /api/driver/vehicles/:id
// @access  Private (Driver)
const updateVehicleById = asyncHandler(async (req, res) => {
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

  // If pricingReference is being updated, validate it
  if (req.body.pricingReference) {
    const { pricingReference } = req.body;
    
    if (!pricingReference.category || !pricingReference.vehicleType || !pricingReference.vehicleModel) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle pricing reference is required (category, vehicleType, and vehicleModel)'
      });
    }

    // Verify that the pricing exists in VehiclePricing model
    const VehiclePricing = require('../models/VehiclePricing');
    const existingPricing = await VehiclePricing.getPricing(
      pricingReference.category,
      pricingReference.vehicleType,
      pricingReference.vehicleModel,
      'one-way' // Default to one-way trip
    );

    if (!existingPricing) {
      return res.status(400).json({
        success: false,
        message: 'No pricing found for the specified vehicle configuration. Please contact admin to set up pricing.'
      });
    }
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

  // If pricingReference was updated, ensure pricing is refreshed
  if (req.body.pricingReference) {
    try {
      await updatedVehicle.populatePricingFromReference();
      console.log(`✅ Pricing updated for vehicle ${updatedVehicle._id}`);
    } catch (pricingError) {
      console.warn(`⚠️ Warning: Could not update pricing for vehicle ${updatedVehicle._id}:`, pricingError.message);
    }
  }

  res.json({
    success: true,
    message: 'Vehicle updated successfully',
    data: updatedVehicle
  });
});

// @desc    Delete vehicle
// @route   DELETE /api/driver/vehicles/:id
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

// @desc    Get driver documents
// @route   GET /api/driver/documents
// @access  Private (Driver)
const getDocuments = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.driver.id).select('documents');
  
  res.json({
    success: true,
    data: driver.documents
  });
});

// @desc    Update driver documents
// @route   PUT /api/driver/documents
// @access  Private (Driver)
const updateDocuments = asyncHandler(async (req, res) => {
  const { documents } = req.body;

  const driver = await Driver.findByIdAndUpdate(
    req.driver.id,
    { documents },
    { new: true, runValidators: true }
  ).select('documents');

  res.json({
    success: true,
    data: driver.documents
  });
});

// @desc    Get driver statistics
// @route   GET /api/driver/stats
// @access  Private (Driver)
const getDriverStats = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.driver.id);
  
  const totalBookings = await Booking.countDocuments({ driver: req.driver.id });
  const completedBookings = await Booking.countDocuments({ 
    driver: req.driver.id, 
    status: 'completed' 
  });
  const cancelledBookings = await Booking.countDocuments({ 
    driver: req.driver.id, 
    status: 'cancelled' 
  });
  
  const totalEarnings = await Booking.aggregate([
    { $match: { driver: req.driver.id, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  const averageRating = await Booking.aggregate([
    { $match: { driver: req.driver.id, 'ratings.driver': { $exists: true } } },
    { $group: { _id: null, avgRating: { $avg: '$ratings.driver' } } }
  ]);

  res.json({
    success: true,
    data: {
      totalBookings,
      completedBookings,
      cancelledBookings,
      completionRate: totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(2) : 0,
      totalEarnings: totalEarnings[0]?.total || 0,
      averageRating: averageRating[0]?.avgRating?.toFixed(1) || 0,
      isOnline: driver.isOnline,
      lastOnline: driver.lastStatusChange
    }
  });
});

// @desc    Request withdrawal
// @route   POST /api/driver/withdraw
// @access  Private (Driver)
const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount, bankDetails } = req.body;

  const driver = await Driver.findById(req.driver.id);
  
  if (amount > driver.wallet.balance) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient balance'
    });
  }

  if (amount < 100) {
    return res.status(400).json({
      success: false,
      message: 'Minimum withdrawal amount is ₹100'
    });
  }

  // Create withdrawal request
  driver.wallet.withdrawals.push({
    amount,
    bankDetails,
    status: 'pending',
    requestedAt: new Date()
  });

  driver.wallet.balance -= amount;
  await driver.save();

  // Send email notification
  await sendEmail(
    driver.email,
    'Withdrawal Request Submitted',
    `Your withdrawal request for ₹${amount} has been submitted and is under review.`
  );

  res.json({
    success: true,
    message: 'Withdrawal request submitted successfully',
    data: {
      amount,
      balance: driver.wallet.balance,
      withdrawalId: driver.wallet.withdrawals[driver.wallet.withdrawals.length - 1]._id
    }
  });
});

module.exports = {
  getDriverProfile,
  updateDriverProfile,
  updateLocation,
  toggleStatus,
  getEarnings,
  getDriverBookings,
  updateBookingStatus,
  getDriverVehicle,
  updateVehicle,
  getDriverVehicles,
  createVehicle,
  updateVehicleById,
  deleteVehicle,
  getDocuments,
  updateDocuments,
  getDriverStats,
  requestWithdrawal,
  completeTrip,
  cancelTrip,
  getActiveTrips,
  getTripHistory
};
