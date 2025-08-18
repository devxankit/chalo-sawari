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

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    populate: [
      { path: 'user', select: 'firstName lastName phone' },
      { path: 'vehicle', select: 'type brand model color' }
    ],
    sort: { createdAt: -1 }
  };

  const bookings = await Booking.paginate(query, options);

  res.json({
    success: true,
    data: bookings
  });
});

// @desc    Update booking status
// @route   PUT /api/driver/bookings/:id/status
// @access  Private (Driver)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const booking = await Booking.findOne({
    _id: id,
    driver: req.driver.id
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

  if (!validTransitions[status] || !validTransitions[status].includes(booking.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot change status from ${booking.status} to ${status}`
    });
  }

  booking.status = status;
  booking.statusHistory.push({
    status,
    timestamp: new Date(),
    updatedBy: req.driver.id,
    reason
  });

  if (status === 'started') {
    booking.tripActuals.startTime = new Date();
  } else if (status === 'completed') {
    booking.tripActuals.endTime = new Date();
    booking.tripActuals.actualDistance = req.body.actualDistance || booking.tripDetails.distance;
    booking.tripActuals.actualDuration = req.body.actualDuration || booking.tripDetails.duration;
  }

  await booking.save();

  res.json({
    success: true,
    data: booking
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
  getDocuments,
  updateDocuments,
  getDriverStats,
  requestWithdrawal
};
