const Admin = require('../models/Admin');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const asyncHandler = require('../middleware/asyncHandler');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

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
    revenue,
    pendingVerifications,
    activeTrips,
    totalRevenue
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
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]),
    // Count drivers pending verification
    Driver.countDocuments({ 
      $or: [
        { isVerified: false },
        { 'documents.drivingLicense.isVerified': false },
        { 'documents.vehicleRC.isVerified': false }
      ]
    }),
    // Count active trips (bookings with status 'in-progress' or 'started')
    Booking.countDocuments({ 
      status: { $in: ['in-progress', 'started', 'confirmed'] } 
    }),
    // Get total revenue from all completed bookings
    Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ])
  ]);

  const pendingBookings = await Booking.countDocuments({ status: 'pending' });
  const activeDrivers = await Driver.countDocuments({ isOnline: true });
  const availableVehicles = await Vehicle.countDocuments({ isAvailable: true });

  // Get recent activity counts
  const recentActivity = await Promise.all([
    User.countDocuments({ createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }),
    Driver.countDocuments({ createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }),
    Booking.countDocuments({ createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } })
  ]);

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
        availableVehicles,
        pendingVerifications,
        activeTrips
      },
      revenue: {
        periodRevenue: revenue[0]?.total || 0,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recent: {
        newUsersToday: recentActivity[0],
        newDriversToday: recentActivity[1],
        newBookingsToday: recentActivity[2]
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

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    isActive,
    isVerified,
    totalBookings,
    totalSpent
  } = req.body;

  // Check if email or phone is being updated and if they already exist
  if (email && email !== req.user?.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
  }

  if (phone && phone !== req.user?.phone) {
    const existingUser = await User.findOne({ phone, _id: { $ne: req.params.id } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already exists'
      });
    }
  }

  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (isVerified !== undefined) updateData.isVerified = isVerified;
  if (totalBookings !== undefined) updateData.totalBookings = totalBookings;
  if (totalSpent !== undefined) updateData.totalSpent = totalSpent;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Log activity
  const admin = await Admin.findById(req.admin.id);
  await admin.logActivity('user_update', `User ${user.firstName} ${user.lastName} details updated`, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if user has active bookings
  const activeBookings = await Booking.countDocuments({
    user: req.params.id,
    status: { $in: ['pending', 'confirmed', 'driver_assigned', 'driver_en_route', 'driver_arrived', 'trip_started'] }
  });

  if (activeBookings > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete user with active bookings. Please complete or cancel all active trips first.'
    });
  }

  // Log activity before deletion
  const admin = await Admin.findById(req.admin.id);
  await admin.logActivity('user_deletion', `User ${user.firstName} ${user.lastName} deleted`, req.ip, req.get('User-Agent'));

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Toggle user verification
// @route   PUT /api/admin/users/:id/verification
// @access  Private (Admin)
const toggleUserVerification = asyncHandler(async (req, res) => {
  const { isVerified } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isVerified },
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
  await admin.logActivity('user_verification_toggle', `User ${user.firstName} ${user.lastName} verification ${isVerified ? 'enabled' : 'disabled'}`, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    message: `User verification ${isVerified ? 'enabled' : 'disabled'} successfully`,
    data: user
  });
});

// @desc    Bulk update user status
// @route   PUT /api/admin/users/bulk/status
// @access  Private (Admin)
const bulkUpdateUserStatus = asyncHandler(async (req, res) => {
  const { userIds, status, reason } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User IDs array is required'
    });
  }

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Status is required'
    });
  }

  const updateResult = await User.updateMany(
    { _id: { $in: userIds } },
    { 
      status,
      'statusHistory.status': status,
      'statusHistory.reason': reason,
      'statusHistory.updatedBy': req.admin.id,
      'statusHistory.updatedAt': new Date()
    }
  );

  // Log activity
  const admin = await Admin.findById(req.admin.id);
  await admin.logActivity('bulk_user_status_update', `Bulk status update for ${userIds.length} users to ${status}`, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    message: `${updateResult.modifiedCount} users updated successfully`,
    data: {
      updatedCount: updateResult.modifiedCount,
      totalCount: userIds.length
    }
  });
});

// @desc    Bulk delete users
// @route   DELETE /api/admin/users/bulk
// @access  Private (Admin)
const bulkDeleteUsers = asyncHandler(async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User IDs array is required'
    });
  }

  // Check if any users have active bookings
  const usersWithActiveBookings = await Booking.aggregate([
    {
      $match: {
        user: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) },
        status: { $in: ['pending', 'confirmed', 'driver_assigned', 'driver_en_route', 'driver_arrived', 'trip_started'] }
      }
    },
    {
      $group: {
        _id: '$user',
        count: { $sum: 1 }
      }
    }
  ]);

  if (usersWithActiveBookings.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Some users have active bookings and cannot be deleted'
    });
  }

  // Get user details for logging
  const usersToDelete = await User.find({ _id: { $in: userIds } }).select('firstName lastName');

  const deleteResult = await User.deleteMany({ _id: { $in: userIds } });

  // Log activity
  const admin = await Admin.findById(req.admin.id);
  const userNames = usersToDelete.map(u => `${u.firstName} ${u.lastName}`).join(', ');
  await admin.logActivity('bulk_user_deletion', `Bulk deletion of ${userIds.length} users: ${userNames}`, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    message: `${deleteResult.deletedCount} users deleted successfully`,
    data: {
      deletedCount: deleteResult.deletedCount,
      totalCount: userIds.length
    }
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

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      select: '-password'
    };

    const drivers = await Driver.paginate(query, options);

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

// @desc    Create new driver (Admin)
// @route   POST /api/admin/drivers
// @access  Private (Admin)
const createDriver = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  
  console.log('Creating driver:', { firstName, lastName, email, phone, hasPassword: !!password });

  // Generate default email if not provided
  const driverEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@chalosawari.com`;
  console.log('Driver email:', driverEmail);

  // Check if driver already exists
  const existingDriver = await Driver.findOne({ 
    $or: [{ email: driverEmail }, { phone: normalizePhone(phone) }] 
  });
  
  if (existingDriver) {
    return res.status(400).json({
      success: false,
      message: existingDriver.email === driverEmail ? 'Email already registered' : 'Phone number already registered'
    });
  }

  // Create driver with minimal required fields and defaults
  const driverData = {
    firstName,
    lastName,
    email: driverEmail,
    phone: normalizePhone(phone),
    password,
    // All other fields will use defaults from the schema
    isActive: true,
    isVerified: true, // Admin-created drivers are verified by default
    isApproved: true // Admin-created drivers are approved by default
  };
  
  console.log('Driver data to create:', { ...driverData, password: '[HIDDEN]' });
  
  const driver = await Driver.create(driverData);
  
  console.log('Driver created successfully:', {
    id: driver._id,
    firstName: driver.firstName,
    lastName: driver.lastName,
    email: driver.email,
    phone: driver.phone,
    isVerified: driver.isVerified,
    isApproved: driver.isApproved,
    isActive: driver.isActive
  });

  // Log admin activity
  await Admin.findByIdAndUpdate(req.admin.id, {
    $push: {
      activityLog: {
        action: 'create_driver',
        details: `Created driver: ${firstName} ${lastName} (${phone})`,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Driver created successfully',
    data: {
      id: driver._id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      isApproved: driver.isApproved
    }
  });
});

// @desc    Delete driver (Admin)
// @route   DELETE /api/admin/drivers/:id
// @access  Private (Admin)
const deleteDriver = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if driver exists
  const driver = await Driver.findById(id);
  if (!driver) {
    return res.status(404).json({
      success: false,
      message: 'Driver not found'
    });
  }

  // Check if driver has active bookings or vehicles
  const hasActiveBookings = await Booking.exists({
    driver: id,
    status: { $in: ['pending', 'confirmed', 'driver_assigned', 'driver_en_route', 'driver_arrived', 'trip_started'] }
  });

  const hasVehicles = await Vehicle.exists({ driver: id });

  if (hasActiveBookings) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete driver with active bookings. Please complete or cancel all bookings first.'
    });
  }

  // Delete associated vehicles if any
  if (hasVehicles) {
    await Vehicle.deleteMany({ driver: id });
  }

  // Delete the driver
  await Driver.findByIdAndDelete(id);

  // Log admin activity
  await Admin.findByIdAndUpdate(req.admin.id, {
    $push: {
      activityLog: {
        action: 'delete_driver',
        details: `Deleted driver: ${driver.firstName} ${driver.lastName} (${driver.phone})`,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    }
  });

  res.json({
    success: true,
    message: 'Driver deleted successfully',
    data: {
      deletedDriver: {
        id: driver._id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        phone: driver.phone
      },
      deletedVehicles: hasVehicles
    }
  });
});

// @desc    Bulk delete drivers (Admin)
// @route   DELETE /api/admin/drivers/bulk
// @access  Private (Admin)
const bulkDeleteDrivers = asyncHandler(async (req, res) => {
  const { driverIds } = req.body;

  if (!driverIds || !Array.isArray(driverIds) || driverIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Driver IDs array is required'
    });
  }

  // Check if all drivers exist
  const drivers = await Driver.find({ _id: { $in: driverIds } });
  if (drivers.length !== driverIds.length) {
    return res.status(400).json({
      success: false,
      message: 'Some drivers not found'
    });
  }

  // Check if any drivers have active bookings
  const driversWithActiveBookings = await Booking.aggregate([
    {
      $match: {
        driver: { $in: driverIds.map(id => new mongoose.Types.ObjectId(id)) },
        status: { $in: ['pending', 'confirmed', 'driver_assigned', 'driver_en_route', 'driver_arrived', 'trip_started'] }
      }
    },
    {
      $group: {
        _id: '$driver',
        count: { $sum: 1 }
      }
    }
  ]);

  if (driversWithActiveBookings.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Some drivers have active bookings. Please complete or cancel all bookings first.'
    });
  }

  // Delete associated vehicles
  const deletedVehicles = await Vehicle.deleteMany({ driver: { $in: driverIds } });

  // Delete the drivers
  const deleteResult = await Driver.deleteMany({ _id: { $in: driverIds } });

  // Log admin activity
  await Admin.findByIdAndUpdate(req.admin.id, {
    $push: {
      activityLog: {
        action: 'bulk_delete_drivers',
        details: `Bulk deleted ${deleteResult.deletedCount} drivers`,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    }
  });

  res.json({
    success: true,
    message: `${deleteResult.deletedCount} drivers deleted successfully`,
    data: {
      deletedCount: deleteResult.deletedCount,
      deletedVehicles: deletedVehicles.deletedCount,
      totalRequested: driverIds.length
    }
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
  const { status, reason, notes } = req.body;

  const booking = await Booking.findById(req.params.id)
    .populate(['user', 'driver', 'vehicle']);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Set temporary fields for status update tracking
  booking._updatedByModel = 'Admin';
  booking._updatedBy = req.admin.id;
  booking._statusReason = reason;
  booking._statusNotes = notes;

  // Update status
  booking.status = status;

  // If cancelling, handle refund logic
  if (status === 'cancelled') {
    booking.cancellation = {
      cancelledBy: req.admin.id,
      cancelledByModel: 'Admin',
      cancelledAt: new Date(),
      reason: reason || 'Cancelled by admin',
      refundAmount: booking.pricing.totalAmount,
      refundStatus: 'pending'
    };
  }

  await booking.save();

  // Log activity
  const admin = await Admin.findById(req.admin.id);
  await admin.logActivity('booking_status_update', `Booking ${booking._id} status updated to ${status}`, req.ip, req.get('User-Agent'));

  res.json({
    success: true,
    data: booking,
    message: `Booking status updated to ${status} successfully`
  });
});

// @desc    Process refund for cancelled booking
// @route   POST /api/admin/bookings/:id/refund
// @access  Private (Admin)
const processRefund = asyncHandler(async (req, res) => {
  const { refundMethod, refundReason, adminNotes } = req.body;

  const booking = await Booking.findById(req.params.id)
    .populate(['user', 'driver', 'vehicle']);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  if (booking.status !== 'cancelled') {
    return res.status(400).json({
      success: false,
      message: 'Refund can only be processed for cancelled bookings'
    });
  }

  if (booking.cancellation.refundStatus === 'completed') {
    return res.status(400).json({
      success: false,
      message: 'Refund has already been processed for this booking'
    });
  }

  try {
    let refundResult = null;
    let paymentUpdate = null;

    if (refundMethod === 'razorpay') {
      // Process refund through Razorpay
      const RazorpayService = require('../services/razorpayService');
      
      // Find the payment record
      const Payment = require('../models/Payment');
      const payment = await Payment.findOne({ 
        booking: booking._id, 
        status: 'completed',
        method: 'razorpay'
      });

      if (!payment) {
        return res.status(400).json({
          success: false,
          message: 'No completed Razorpay payment found for this booking'
        });
      }

      // Process refund through Razorpay
      refundResult = await RazorpayService.processRefund(
        payment.paymentDetails.razorpayPaymentId,
        booking.pricing.totalAmount,
        refundReason || 'Booking cancelled by admin'
      );

      // Update payment record
      payment.refund = {
        amount: booking.pricing.totalAmount,
        reason: refundReason || 'Booking cancelled by admin',
        refundedAt: new Date(),
        refundId: refundResult.refundId,
        gatewayRefundId: refundResult.refundId
      };
      payment.status = 'refunded';
      payment.timestamps.refunded = new Date();
      await payment.save();

      // Update booking refund status
      booking.cancellation.refundStatus = 'completed';
      await booking.save();

    } else if (refundMethod === 'manual') {
      // Manual refund processing
      const Payment = require('../models/Payment');
      const payment = await Payment.findOne({ 
        booking: booking._id, 
        status: 'completed'
      });

      if (payment) {
        payment.refund = {
          amount: booking.pricing.totalAmount,
          reason: refundReason || 'Manual refund by admin',
          refundedAt: new Date(),
          refundId: `MANUAL_${Date.now()}`,
          gatewayRefundId: null
        };
        payment.status = 'refunded';
        payment.timestamps.refunded = new Date();
        await payment.save();
      }

      // Update booking refund status
      booking.cancellation.refundStatus = 'completed';
      await booking.save();

      refundResult = {
        refundId: `MANUAL_${Date.now()}`,
        status: 'processed',
        amount: booking.pricing.totalAmount,
        notes: 'Manual refund processed by admin'
      };
    }

    // Log admin activity
    const admin = await Admin.findById(req.admin.id);
    await admin.logActivity('refund_processed', 
      `Refund processed for booking ${booking._id} via ${refundMethod}`, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: `Refund processed successfully via ${refundMethod}`,
      data: {
        booking: booking._id,
        refundAmount: booking.pricing.totalAmount,
        refundMethod,
        refundId: refundResult.refundId,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      message: `Refund processing failed: ${error.message}`
    });
  }
});

// @desc    Get booking payment details
// @route   GET /api/admin/bookings/:id/payment
// @access  Private (Admin)
const getBookingPaymentDetails = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate(['user', 'driver', 'vehicle']);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: 'Booking not found'
    });
  }

  // Find payment records
  const Payment = require('../models/Payment');
  const payments = await Payment.find({ booking: booking._id })
    .sort({ createdAt: -1 });

  // Get refund details if any
  let refundDetails = null;
  if (payments.length > 0) {
    const completedPayment = payments.find(p => p.status === 'completed');
    if (completedPayment && completedPayment.method === 'razorpay') {
      try {
        const RazorpayService = require('../services/razorpayService');
        const refunds = await RazorpayService.getPaymentRefunds(completedPayment.paymentDetails.razorpayPaymentId);
        refundDetails = refunds;
      } catch (error) {
        console.error('Error fetching refund details:', error);
      }
    }
  }

  res.json({
    success: true,
    data: {
      booking,
      payments,
      refundDetails,
      canProcessRefund: booking.status === 'cancelled' && 
                       booking.cancellation.refundStatus === 'pending'
    }
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

// @desc    Delete vehicle
// @route   DELETE /api/admin/vehicles/:id
// @access  Private (Admin)
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);

  if (!vehicle) {
    res.status(404);
    throw new Error('Vehicle not found');
  }

  // Check if vehicle is currently in an active booking
  if (vehicle.bookingStatus === 'booked' || vehicle.bookingStatus === 'in_trip') {
    res.status(400);
    throw new Error('Cannot delete vehicle that is currently in use');
  }

  // Delete the vehicle
  await Vehicle.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: `Vehicle ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) has been deleted successfully`
  });
});

// @desc    Update cash payment status for partial payment bookings
// @route   PUT /api/admin/bookings/:id/cash-collected
// @access  Private (Admin)
const updateCashPaymentStatus = asyncHandler(async (req, res) => {
  try {
    const { notes } = req.body;
    const { id: bookingId } = req.params;

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if this is a partial payment booking
    if (!booking.payment.isPartialPayment) {
      return res.status(400).json({
        success: false,
        message: 'This booking does not have partial payment setup'
      });
    }

    // Update the cash payment status
    if (booking.payment.partialPaymentDetails) {
      booking.payment.partialPaymentDetails.cashPaymentStatus = 'collected';
      booking.payment.partialPaymentDetails.cashCollectedAt = new Date();
      booking.payment.partialPaymentDetails.cashCollectedBy = req.admin.id;
      booking.payment.partialPaymentDetails.cashCollectedByModel = 'Admin';
    }

    // If both online and cash payments are completed, mark overall payment as completed
    if (booking.payment.partialPaymentDetails?.onlinePaymentStatus === 'completed' && 
        booking.payment.partialPaymentDetails?.cashPaymentStatus === 'collected') {
      booking.payment.status = 'completed';
      booking.payment.completedAt = new Date();
    }

    await booking.save();

    // Log admin activity
    const admin = await Admin.findById(req.admin.id);
    await admin.logActivity(
      'cash_payment_collected', 
      `Cash payment collected for booking ${booking.bookingNumber}`, 
      req.ip, 
      req.get('User-Agent')
    );

    res.json({
      success: true,
      message: 'Cash payment marked as collected successfully',
      data: {
        bookingId: booking._id,
        cashPaymentStatus: 'collected',
        collectedAt: new Date(),
        collectedBy: req.admin.id
      }
    });
  } catch (error) {
    console.error('Error updating cash payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cash payment status',
      error: error.message
    });
  }
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
  updateUser,
  deleteUser,
  toggleUserVerification,
  bulkUpdateUserStatus,
  bulkDeleteUsers,
  getAllDrivers,
  getDriverById,
  updateDriverStatus,
  createDriver,
  deleteDriver,
  bulkDeleteDrivers,
  getAllVehicles,
  getPendingVehicleApprovals,
  approveVehicle,
  rejectVehicle,
  deleteVehicle,
  getVehicleApprovalStats,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  processRefund,
  getBookingPaymentDetails,
  updateCashPaymentStatus,
  getSystemAnalytics,
  getActivityLog
};
