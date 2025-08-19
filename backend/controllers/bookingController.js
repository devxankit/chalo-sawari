const Booking = require('../models/Booking');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const { sendEmail, sendBookingConfirmationSMS, sendDriverAssignmentSMS } = require('../utils/notifications');
const asyncHandler = require('../middleware/asyncHandler');

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
    passengers,
    specialRequests,
    paymentMethod
  } = req.body;

  // Validate vehicle availability
  const vehicle = await Vehicle.findById(vehicleId).populate('driver');
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  if (!vehicle.isAvailable) {
    return res.status(400).json({
      success: false,
      message: 'Vehicle is not available'
    });
  }

  if (!vehicle.driver || vehicle.driver.status !== 'active' || !vehicle.driver.isOnline) {
    return res.status(400).json({
      success: false,
      message: 'Driver is not available'
    });
  }

  // Check if user has sufficient wallet balance for wallet payments
  if (paymentMethod === 'wallet') {
    const user = await User.findById(req.user.id);
    // Get the base price from computed pricing or use a default
    const basePrice = vehicle.computedPricing?.basePrice || 100;
    if (user.wallet.balance < basePrice) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance'
      });
    }
  }

  // Calculate fare using the new calculateFare method
  const distance = calculateDistance(pickup, destination);
  let totalAmount;
  try {
    totalAmount = await vehicle.calculateFare(distance, false, false, 0);
    // Add taxes
    const taxes = totalAmount * 0.18; // 18% GST
    totalAmount = totalAmount + taxes;
  } catch (error) {
    console.error('Error calculating fare:', error);
    return res.status(500).json({
      success: false,
      message: 'Error calculating fare'
    });
  }

  // Create booking
  const booking = await Booking.create({
    user: req.user.id,
    driver: vehicle.driver._id,
    vehicle: vehicleId,
    bookingNumber: generateBookingNumber(),
    tripDetails: {
      pickup,
      destination,
      date: new Date(date),
      time: new Date(time),
      passengers: parseInt(passengers),
      distance: distance.toFixed(2),
      duration: (distance * 2).toFixed(0) // Rough estimate: 2 min per km
    },
    pricing: {
      baseFare: vehicle.computedPricing?.basePrice || 100,
      totalAmount: totalAmount.toFixed(2)
    },
    payment: {
      method: paymentMethod,
      status: paymentMethod === 'wallet' ? 'completed' : 'pending',
      amount: totalAmount
    },
    specialRequests,
    status: 'pending'
  });

  // Update vehicle availability
  vehicle.isAvailable = false;
  vehicle.availabilityHistory.push({
    status: 'booked',
    reason: 'Booking created',
    timestamp: new Date()
  });
  await vehicle.save();

  // Send notifications
  await Promise.all([
    sendBookingConfirmationSMS(req.user.phone, booking.bookingNumber, totalAmount),
    sendDriverAssignmentSMS(vehicle.driver.phone, booking.bookingNumber, pickup.address)
  ]);

  // If payment method is wallet, deduct amount
  if (paymentMethod === 'wallet') {
    const user = await User.findById(req.user.id);
    user.wallet.balance -= totalAmount;
    user.wallet.transactions.push({
      type: 'debit',
      amount: totalAmount,
      description: `Booking ${booking.bookingNumber}`,
      timestamp: new Date()
    });
    await user.save();
  }

  res.status(201).json({
    success: true,
    data: booking
  });
});

// @desc    Get user bookings
// @route   GET /api/bookings
// @access  Private (User)
const getUserBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { user: req.user.id };
  if (status) query.status = status;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      { path: 'driver', select: 'firstName lastName phone rating' },
      { path: 'vehicle', select: 'type brand model color registrationNumber' }
    ],
    sort: { createdAt: -1 }
  };

  const bookings = await Booking.paginate(query, options);

  res.json({
    success: true,
    data: bookings
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

  if (!['pending', 'accepted'].includes(booking.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel booking in current status'
    });
  }

  // Calculate cancellation fee
  const cancellationFee = calculateCancellationFee(booking);
  
  booking.status = 'cancelled';
  booking.cancellation = {
    reason,
    fee: cancellationFee,
    cancelledBy: req.user.id,
    cancelledAt: new Date()
  };
  booking.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    updatedBy: req.user.id,
    reason
  });

  await booking.save();

  // Update vehicle availability
  await Vehicle.findByIdAndUpdate(booking.vehicle, {
    isAvailable: true,
    $push: {
      availabilityHistory: {
        status: 'available',
        reason: 'Booking cancelled',
        timestamp: new Date()
      }
    }
  });

  // Refund wallet if payment was made via wallet
  if (booking.payment.method === 'wallet' && booking.payment.status === 'completed') {
    const refundAmount = booking.pricing.totalAmount - cancellationFee;
    if (refundAmount > 0) {
      const user = await User.findById(req.user.id);
      user.wallet.balance += refundAmount;
      user.wallet.transactions.push({
        type: 'credit',
        amount: refundAmount,
        description: `Refund for cancelled booking ${booking.bookingNumber}`,
        timestamp: new Date()
      });
      await user.save();
    }
  }

  res.json({
    success: true,
    data: booking
  });
});

// @desc    Rate booking
// @route   POST /api/bookings/:id/rate
// @access  Private (User)
const rateBooking = asyncHandler(async (req, res) => {
  const { driverRating, vehicleRating, comment } = req.body;

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
      message: 'Not authorized to rate this booking'
    });
  }

  if (booking.status !== 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Can only rate completed bookings'
    });
  }

  if (booking.ratings.user) {
    return res.status(400).json({
      success: false,
      message: 'Booking already rated'
    });
  }

  booking.ratings = {
    user: req.user.id,
    driver: driverRating,
    vehicle: vehicleRating,
    comment,
    timestamp: new Date()
  };

  await booking.save();

  // Update driver and vehicle ratings
  await Promise.all([
    Driver.findByIdAndUpdate(booking.driver, {
      $inc: { 'rating.total': driverRating, 'rating.count': 1 }
    }),
    Vehicle.findByIdAndUpdate(booking.vehicle, {
      $inc: { 'rating.total': vehicleRating, 'rating.count': 1 }
    })
  ]);

  // Recalculate average ratings
  await Promise.all([
    recalculateDriverRating(booking.driver),
    recalculateVehicleRating(booking.vehicle)
  ]);

  res.json({
    success: true,
    data: booking.ratings
  });
});

// @desc    Add message to booking
// @route   POST /api/bookings/:id/messages
// @access  Private (User/Driver)
const addMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if user is authorized to add messages
  let senderId, senderType;
  if (req.user && booking.user.toString() === req.user.id) {
    senderId = req.user.id;
    senderType = 'user';
  } else if (req.driver && booking.driver.toString() === req.driver.id) {
    senderId = req.driver.id;
    senderType = 'driver';
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to add messages to this booking'
    });
  }

  booking.communication.messages.push({
    sender: senderId,
    senderType,
    message,
    timestamp: new Date()
  });

  await booking.save();

  res.json({
    success: true,
    data: booking.communication.messages[booking.communication.messages.length - 1]
  });
});

// @desc    Get booking messages
// @route   GET /api/bookings/:id/messages
// @access  Private (User/Driver)
const getBookingMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Check if user is authorized to view messages
  if (req.user && booking.user.toString() !== req.user.id) {
    if (req.driver && booking.driver.toString() !== req.driver.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view messages for this booking'
      });
    }
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { timestamp: -1 }
  };

  const messages = await Booking.paginate(
    { _id: req.params.id },
    {
      ...options,
      populate: [
        { path: 'communication.messages.sender', select: 'firstName lastName' }
      ],
      select: 'communication.messages'
    }
  );

  res.json({
    success: true,
    data: messages
  });
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (User/Driver)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

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
  if (reason) {
    booking.statusHistory.push({
      status,
      reason,
      timestamp: new Date(),
      updatedBy: req.user ? req.user.id : req.driver.id
    });
  }

  await booking.save();

  res.json({
    success: true,
    data: booking
  });
});

// Helper functions
function calculateDistance(pickup, destination) {
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

function calculateSurgePricing(date, time) {
  const hour = new Date(time).getHours();
  
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return 1.5; // 50% surge
  }
  
  if (hour >= 22 || hour <= 6) {
    return 1.3; // 30% surge
  }
  
  return 1.0; // Normal pricing
}

function generateBookingNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `CS${timestamp}${random}`;
}

function calculateCancellationFee(booking) {
  const now = new Date();
  const bookingTime = new Date(booking.tripDetails.date + ' ' + booking.tripDetails.time);
  const timeDiff = bookingTime - now;
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  if (hoursDiff > 24) {
    return 0; // No fee if cancelled more than 24 hours before
  } else if (hoursDiff > 2) {
    return booking.pricing.totalAmount * 0.1; // 10% fee
  } else {
    return booking.pricing.totalAmount * 0.25; // 25% fee
  }
}

async function recalculateDriverRating(driverId) {
  const driver = await Driver.findById(driverId);
  if (driver && driver.rating.count > 0) {
    driver.rating.average = driver.rating.total / driver.rating.count;
    await driver.save();
  }
}

async function recalculateVehicleRating(vehicleId) {
  const vehicle = await Vehicle.findById(vehicleId);
  if (vehicle && vehicle.rating.count > 0) {
    vehicle.rating.average = vehicle.rating.total / vehicle.rating.count;
    await vehicle.save();
  }
}

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
  rateBooking,
  addMessage,
  getBookingMessages
};
