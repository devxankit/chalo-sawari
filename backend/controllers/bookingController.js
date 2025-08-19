const Booking = require('../models/Booking');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../middleware/asyncHandler');

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (point1, point2) => {
  const R = 6371; // Earth's radius in kilometers
  
  // Use latitude and longitude properties (matching frontend payload)
  const lat1 = point1.latitude * Math.PI / 180;
  const lat2 = point2.latitude * Math.PI / 180;
  const deltaLat = (point2.latitude - point1.latitude) * Math.PI / 180;
  const deltaLon = (point2.longitude - point1.longitude) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (User)
const createBooking = asyncHandler(async (req, res) => {
  const {
    vehicleId,
    pickup,
    destination,
    date,
    time,
    passengers = 1,
    specialRequests = '',
    paymentMethod
  } = req.body;

  // Validate required fields
  if (!vehicleId || !pickup || !destination || !date || !time || !paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: vehicleId, pickup, destination, date, time, paymentMethod'
    });
  }

  // Validate vehicle exists and get driver info
  const vehicle = await Vehicle.findById(vehicleId).populate('driver');
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  if (!vehicle.driver) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle has no assigned driver'
    });
  }

  // Validate coordinates are valid numbers
  if (isNaN(pickup.latitude) || isNaN(pickup.longitude) || 
      isNaN(destination.latitude) || isNaN(destination.longitude)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid coordinates provided. Latitude and longitude must be valid numbers.'
    });
  }

  // Calculate distance
  const distance = calculateDistance(pickup, destination);
  
  // Validate distance calculation
  if (isNaN(distance) || distance <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Unable to calculate distance. Please check coordinates.'
    });
  }
  
  console.log('Debug - Distance calculated:', distance);
  
  // Calculate total amount using vehicle pricing
  let totalAmount = 0;
  let ratePerKm = 0;
  
  try {
    // Get trip type from request or default to one-way
    const tripType = req.body.tripType || 'one-way';
    
    // Calculate fare based on vehicle type and pricing
    if (vehicle.pricingReference?.category === 'auto') {
      // For auto vehicles, use fixed auto price
      const autoPricing = vehicle.pricing?.autoPrice;
      if (tripType === 'return') {
        totalAmount = autoPricing?.return || autoPricing?.oneWay || 0;
        ratePerKm = totalAmount / distance; // Calculate rate for display
      } else {
        totalAmount = autoPricing?.oneWay || 0;
        ratePerKm = totalAmount / distance; // Calculate rate for display
      }
    } else {
      // For car and bus vehicles, calculate distance-based pricing
      const distancePricing = vehicle.pricing?.distancePricing;
      if (distancePricing) {
        // Try multiple possible trip type keys
        let pricing = distancePricing[tripType];
        if (!pricing) {
          pricing = distancePricing['oneWay'] || 
                    distancePricing['one-way'] || 
                    distancePricing['oneway'] ||
                    distancePricing['return'] ||
                    Object.values(distancePricing)[0];
        }
        
        if (pricing) {
          // Determine rate based on distance tier
          if (distance <= 50 && pricing['50km']) {
            ratePerKm = pricing['50km'];
          } else if (distance <= 100 && pricing['100km']) {
            ratePerKm = pricing['100km'];
          } else if (distance <= 150 && pricing['150km']) {
            ratePerKm = pricing['150km'];
          } else if (pricing['150km']) {
            ratePerKm = pricing['150km'];
          } else if (pricing['100km']) {
            ratePerKm = pricing['100km'];
          } else if (pricing['50km']) {
            ratePerKm = pricing['50km'];
          }
          
          totalAmount = ratePerKm * distance;
        }
      }
    }
    
    if (totalAmount === 0 || isNaN(totalAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Unable to calculate fare. Please check vehicle pricing.'
      });
    }
    
    console.log('Debug - Total amount calculated:', totalAmount);
    console.log('Debug - Rate per km:', ratePerKm);
    
  } catch (error) {
    console.error('Error calculating fare:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating fare'
    });
  }

  console.log('Debug - Creating booking with driver:', {
    vehicleId: vehicleId,
    vehicleDriverId: vehicle.driver._id,
    vehicleDriverName: vehicle.driver.firstName
  });

  // Create booking with the new structure
  const booking = await Booking.create({
    user: req.user.id,
    vehicle: vehicleId,
    driver: vehicle.driver._id,
    tripDetails: {
      pickup: {
        latitude: pickup.latitude,
        longitude: pickup.longitude,
        address: pickup.address
      },
      destination: {
        latitude: destination.latitude,
        longitude: destination.longitude,
        address: destination.address
      },
      date: date,
      time: time,
      passengers: passengers,
      distance: distance,
      duration: Math.round(distance * 2) // Rough estimate: 2 min per km
    },
    pricing: {
      ratePerKm: ratePerKm,
      totalAmount: totalAmount,
      tripType: req.body.tripType || 'one-way'
    },
    payment: {
      method: paymentMethod,
      status: 'pending'
    },
    specialRequests: specialRequests,
    status: 'pending'
  });

  console.log('Debug - Booking created successfully:', {
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    driver: booking.driver,
    status: booking.status
  });

  // Update vehicle availability (mark as booked)
  vehicle.booked = true;
  vehicle.isActive = false;
  await vehicle.save();

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      totalAmount: booking.pricing.totalAmount,
      status: booking.status
    }
  });
});

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private (User)
const getUserBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { user: req.user.id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate([
        { path: 'driver', select: 'firstName lastName phone rating' },
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

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private (User/Driver)
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate([
      { path: 'user', select: 'firstName lastName phone email' },
      { path: 'driver', select: 'firstName lastName phone rating' },
      { path: 'vehicle', select: 'type brand model color registrationNumber' }
    ]);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if user is authorized to view this booking
  if (req.user && booking.user.toString() !== req.user.id) {
    if (req.driver && booking.driver.toString() !== req.driver.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }
  }

  res.json({
    success: true,
    data: booking
  });
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (User)
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this booking'
    });
  }

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel booking in current status'
    });
  }

  // Update booking status
  booking.status = 'cancelled';
  await booking.save();

  // Update vehicle availability
  await Vehicle.findByIdAndUpdate(booking.vehicle, {
    booked: false,
    isActive: true
  });

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: booking
  });
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (User/Driver)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if user is authorized to update this booking
  if (req.user && booking.user.toString() !== req.user.id) {
    if (req.driver && booking.driver.toString() !== req.driver.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }
  }

  // Update status
  booking.status = status;
  await booking.save();

  res.json({
    success: true,
    message: 'Booking status updated successfully',
    data: booking
  });
});

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus
};
