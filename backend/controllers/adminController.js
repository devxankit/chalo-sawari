const Admin = require('../models/Admin');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const asyncHandler = require('../middleware/asyncHandler');
const bcrypt = require('bcryptjs');

// Helper: normalize Indian phone to last 10 digits
const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/[^0-9]/g, '');
  return digits.slice(-10);
};

// @desc    Admin signup
// @route   POST /api/admin/signup
// @access  Public
const adminSignup = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Password and confirm password do not match' });
  }

  const normalizedPhone = normalizePhone(phone);

  const existingAdmin = await Admin.findOne({ phone: normalizedPhone });
  if (existingAdmin) {
    return res.status(400).json({ success: false, message: 'Admin with this phone number already exists' });
  }

  const admin = await Admin.create({ firstName, lastName, phone: normalizedPhone, password });

  const token = admin.getSignedJwtToken();
  await admin.logActivity('signup', 'Admin account created', req.ip, req.get('User-Agent'));

  return res.status(201).json({
    success: true,
    token,
    admin: {
      id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      phone: admin.phone
    }
  });
});

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ success: false, message: 'Please provide phone number and password' });
  }

  const normalizedPhone = normalizePhone(phone);

  // Find admin by normalized phone
  let admin = await Admin.findOne({ phone: normalizedPhone }).select('+password');

  if (!admin) {
    admin = await Admin.findOne({ phone: { $regex: `${normalizedPhone}$` } }).select('+password');
    if (admin && admin.phone !== normalizedPhone) {
      const conflicting = await Admin.findOne({ phone: normalizedPhone });
      if (!conflicting) {
        admin.phone = normalizedPhone;
        await admin.save();
      }
    }
  }

  if (!admin) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (admin.isLocked()) {
    return res.status(423).json({ success: false, message: 'Account is temporarily locked due to multiple failed login attempts' });
  }

  let isMatch = false;
  try { isMatch = await admin.matchPassword(password); } catch (_) { isMatch = false; }

  // Legacy plaintext migration
  if (!isMatch && typeof admin.password === 'string') {
    const looksHashed = admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$');
    if (!looksHashed && admin.password === password) {
      admin.password = password; // pre-save will hash
      await admin.save();
      isMatch = true;
    }
  }

  if (!isMatch) {
    await admin.incLoginAttempts();
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  await admin.resetLoginAttempts();
  await admin.updateLastLogin();

  const token = admin.getSignedJwtToken();
  await admin.logActivity('login', 'Admin logged in successfully', req.ip, req.get('User-Agent'));

  return res.status(200).json({
    success: true,
    token,
    admin: {
      id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      phone: admin.phone
    }
  });
});

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id).select('-password');
  res.json({ success: true, data: admin });
});

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin)
const updateAdminProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone } = req.body;

  const admin = await Admin.findByIdAndUpdate(
    req.admin.id,
    { firstName, lastName, phone },
    { new: true, runValidators: true }
  ).select('-password');

  // Log activity
  await admin.logActivity('profile_update', 'Admin profile updated', req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    data: admin
  });
});

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardStats = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let dateFilter = {};
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

  const [
    totalUsers,
    totalDrivers,
    totalVehicles,
    totalBookings,
    newUsers,
    newDrivers,
    newBookings,
    revenue
  ] = await Promise.all([
    User.countDocuments(),
    Driver.countDocuments(),
    Vehicle.countDocuments(),
    Booking.countDocuments(),
    User.countDocuments(dateFilter),
    Driver.countDocuments(dateFilter),
    Booking.countDocuments(dateFilter),
    Booking.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
  ]);

  const pendingBookings = await Booking.countDocuments({ status: 'pending' });
  const activeDrivers = await Driver.countDocuments({ isOnline: true });
  const availableVehicles = await Vehicle.countDocuments({ isAvailable: true });

  res.json({
    success: true,
    data: {
      period,
      overview: {
        totalUsers,
        totalDrivers,
        totalVehicles,
        totalBookings
      },
      growth: {
        newUsers,
        newDrivers,
        newBookings,
        revenue: revenue[0]?.total || 0
      },
      current: {
        pendingBookings,
        activeDrivers,
        availableVehicles
      }
    }
  });
});

// @desc    Get all users with pagination and filters
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    status, 
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  let query = {};
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (status) query.status = status;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
    select: '-password'
  };

  const users = await User.paginate(query, options);

  res.json({
    success: true,
    data: users
  });
});

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('bookings');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { 
      status,
      'statusHistory.status': status,
      'statusHistory.reason': reason,
      'statusHistory.updatedBy': req.admin.id,
      'statusHistory.updatedAt': new Date()
    },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Log activity
  const admin = await Admin.findById(req.admin.id);
  await admin.logActivity('user_status_update', `User ${user.firstName} ${user.lastName} status updated to ${status}`, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    data: user
  });
});

// @desc    Get all drivers with pagination and filters
// @route   GET /api/admin/drivers
// @access  Private (Admin)
const getAllDrivers = asyncHandler(async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      status, 
      isOnline,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    console.log('🔍 Admin getAllDrivers called with:', { page, limit, search, status, isOnline, sortBy, sortOrder });

    let query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      // Map status to actual Driver model fields
      switch (status) {
        case 'active':
          query.isActive = true;
          break;
        case 'inactive':
          query.isActive = false;
          break;
        case 'verified':
          query.isVerified = true;
          break;
        case 'pending':
          query.isApproved = false;
          break;
        case 'suspended':
          query.isActive = false;
          break;
      }
    }
    
    if (isOnline !== undefined) query['availability.isOnline'] = isOnline === 'true';

    console.log('🔍 Final query:', JSON.stringify(query, null, 2));

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      select: '-password'
    };

    console.log('🔍 Query options:', options);

    const drivers = await Driver.paginate(query, options);

    console.log('✅ Found drivers:', drivers.docs?.length || 0);

    res.json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('❌ Error in getAllDrivers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers',
      error: error.message
    });
  }
});

// @desc    Get driver by ID
// @route   GET /api/admin/drivers/:id
// @access  Private (Admin)
const getDriverById = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id)
    .select('-password')
    .populate('vehicleDetails');

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
  }

  res.json({
    success: true,
    data: driver
  });
});

// @desc    Update driver status
// @route   PUT /api/admin/drivers/:id/status
// @access  Private (Admin)
const updateDriverStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  const driver = await Driver.findByIdAndUpdate(
    req.params.id,
    { 
      status,
      'statusHistory.status': status,
      'statusHistory.reason': reason,
      'statusHistory.updatedBy': req.admin.id,
      'statusHistory.updatedAt': new Date()
    },
    { new: true }
  ).select('-password');

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
  }

  // Log activity
  const admin = await Admin.findById(req.admin.id);
  await admin.logActivity('driver_status_update', `Driver ${driver.firstName} ${driver.lastName} status updated to ${status}`, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    data: driver
  });
});

// @desc    Get all vehicles with pagination and filters
// @route   GET /api/admin/vehicles
// @access  Private (Admin)
const getAllVehicles = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    type, 
    isAvailable,
    approvalStatus,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  let query = {};
  
  if (search) {
    query.$or = [
      { brand: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
      { registrationNumber: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (type) query.type = type;
  if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';
  if (approvalStatus) query.approvalStatus = approvalStatus;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
    populate: 'driver'
  };

  const vehicles = await Vehicle.paginate(query, options);

  res.json({
    success: true,
    data: vehicles
  });
});

// @desc    Get pending vehicle approvals
// @route   GET /api/admin/vehicles/pending
// @access  Private (Admin)
const getPendingVehicleApprovals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: {
      path: 'driver',
      select: 'firstName lastName phone email rating status'
    }
  };

  const vehicles = await Vehicle.paginate(
    { approvalStatus: 'pending' },
    options
  );

  res.json({
    success: true,
    data: vehicles
  });
});

// @desc    Approve vehicle
// @route   PUT /api/admin/vehicles/:id/approve
// @access  Private (Admin)
const approveVehicle = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  if (vehicle.approvalStatus === 'approved') {
    return res.status(400).json({
      success: false,
      message: 'Vehicle is already approved'
    });
  }

  await vehicle.approveVehicle(req.admin.id, notes);

  // Log activity
  const admin = await Admin.findById(req.admin.id);
  await admin.logActivity('vehicle_approval', `Vehicle ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) approved`, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    message: 'Vehicle approved successfully',
    data: vehicle
  });
});

// @desc    Reject vehicle
// @route   PUT /api/admin/vehicles/:id/reject
// @access  Private (Admin)
const rejectVehicle = asyncHandler(async (req, res) => {
  const { reason, notes } = req.body;

  if (!reason) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason is required'
    });
  }

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      message: 'Vehicle not found'
    });
  }

  if (vehicle.approvalStatus === 'rejected') {
    return res.status(400).json({
      success: false,
      message: 'Vehicle is already rejected'
    });
  }

  await vehicle.rejectVehicle(req.admin.id, reason, notes);

  // Log activity
  const admin = await Admin.findById(req.admin.id);
  await admin.logActivity('vehicle_rejection', `Vehicle ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) rejected: ${reason}`, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    message: 'Vehicle rejected successfully',
    data: vehicle
  });
});

// @desc    Get vehicle approval statistics
// @route   GET /api/admin/vehicles/approval-stats
// @access  Private (Admin)
const getVehicleApprovalStats = asyncHandler(async (req, res) => {
  const stats = await Vehicle.aggregate([
    {
      $group: {
        _id: '$approvalStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const formattedStats = {
    pending: 0,
    approved: 0,
    rejected: 0
  };

  stats.forEach(stat => {
    formattedStats[stat._id] = stat.count;
  });

  res.json({
    success: true,
    data: formattedStats
  });
});

// @desc    Get all bookings with pagination and filters
// @route   GET /api/admin/bookings
// @access  Private (Admin)
const getAllBookings = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    startDate,
    endDate,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;

  let query = {};
  
  if (status) query.status = status;
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
    populate: ['user', 'driver', 'vehicle']
  };

  const bookings = await Booking.paginate(query, options);

  res.json({
    success: true,
    data: bookings
  });
});

// @desc    Get booking by ID
// @route   GET /api/admin/bookings/:id
// @access  Private (Admin)
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate(['user', 'driver', 'vehicle']);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  res.json({
    success: true,
    data: booking
  });
});

// @desc    Update booking status
// @route   PUT /api/admin/bookings/:id/status
// @access  Private (Admin)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    {
      status,
      'statusHistory.status': status,
      'statusHistory.reason': reason,
      'statusHistory.updatedBy': req.admin.id,
      'statusHistory.updatedAt': new Date()
    },
    { new: true }
  ).populate(['user', 'driver', 'vehicle']);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Log activity
  const admin = await Admin.findById(req.admin.id);
  await admin.logActivity('booking_status_update', `Booking ${booking._id} status updated to ${status}`, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    data: booking
  });
});

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getSystemAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  
  let dateFilter = {};
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

  const [
    revenueData,
    bookingTrends,
    userGrowth,
    driverGrowth,
    topRoutes,
    vehicleUtilization
  ] = await Promise.all([
    // Revenue analytics
    Booking.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // Booking trends
    Booking.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // User growth
    User.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // Driver growth
    Driver.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    
    // Top routes
    Booking.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      {
        $group: {
          _id: {
            from: '$tripDetails.pickup.city',
            to: '$tripDetails.destination.city'
          },
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    
    // Vehicle utilization
    Vehicle.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'vehicle',
          as: 'bookings'
        }
      },
      {
        $project: {
          type: 1,
          brand: 1,
          model: 1,
          utilization: {
            $divide: [
              { $size: '$bookings' },
              { $max: [1, { $size: '$bookings' }] }
            ]
          }
        }
      },
      { $sort: { utilization: -1 } },
      { $limit: 10 }
    ])
  ]);

  res.json({
    success: true,
    data: {
      period,
      revenue: revenueData,
      bookings: bookingTrends,
      users: userGrowth,
      drivers: driverGrowth,
      topRoutes,
      vehicleUtilization
    }
  });
});

// @desc    Get admin activity log
// @route   GET /api/admin/activity-log
// @access  Private (Admin)
const getActivityLog = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { timestamp: -1 }
  };

  const logs = await Admin.aggregate([
    { $unwind: '$activityLog' },
    { $sort: { 'activityLog.timestamp': -1 } },
    { $skip: (options.page - 1) * options.limit },
    { $limit: options.limit },
    {
      $project: {
        adminName: { $concat: ['$firstName', ' ', '$lastName'] },
        action: '$activityLog.action',
        details: '$activityLog.details',
        timestamp: '$activityLog.timestamp',
        ipAddress: '$activityLog.ipAddress'
      }
    }
  ]);

  res.json({
    success: true,
    data: logs
  });
});

module.exports = {
  adminSignup,
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAllDrivers,
  getDriverById,
  updateDriverStatus,
  getAllVehicles,
  getPendingVehicleApprovals,
  approveVehicle,
  rejectVehicle,
  getVehicleApprovalStats,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getSystemAnalytics,
  getActivityLog
};
