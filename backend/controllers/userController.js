const User = require('../models/User');
const Booking = require('../models/Booking');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      dateOfBirth,
      address,
      emergencyContact
    } = req.body;

    // Check if email or phone is being updated and if they already exist
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Email already exists',
            statusCode: 400
          }
        });
      }
    }

    if (phone && phone !== req.user.phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Phone number already exists',
            statusCode: 400
          }
        });
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        email,
        phone,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        address,
        emergencyContact
      },
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user bookings
// @route   GET /api/user/bookings
// @access  Private
const getUserBookings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    let query = { user: req.user.id };

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    // If specific booking ID is requested
    if (id) {
      const booking = await Booking.findById(id)
        .populate('driver', 'firstName lastName phone')
        .populate('vehicle', 'brand model color registrationNumber');

      if (!booking) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Booking not found',
            statusCode: 404
          }
        });
      }

      // Check if user owns this booking
      if (booking.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Not authorized to access this booking',
            statusCode: 403
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          booking
        }
      });
    }

    // Pagination
    const skip = (page - 1) * limit;
    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / limit);

    const bookings = await Booking.find(query)
      .populate('driver', 'firstName lastName phone')
      .populate('vehicle', 'brand model color registrationNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBookings,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user wallet
// @route   GET /api/user/wallet
// @access  Private
const getUserWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('wallet');

    res.status(200).json({
      success: true,
      data: {
        wallet: user.wallet
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add money to wallet
// @route   POST /api/user/wallet/add-money
// @access  Private
const addMoneyToWallet = async (req, res, next) => {
  try {
    const { amount, description = 'Wallet recharge' } = req.body;

    const user = await User.findById(req.user.id);
    
    // Add money to wallet
    await user.addToWallet(amount, description);

    res.status(200).json({
      success: true,
      message: `₹${amount} added to wallet successfully`,
      data: {
        wallet: user.wallet
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user preferences
// @route   GET /api/user/preferences
// @access  Private
const getUserPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('preferences');

    res.status(200).json({
      success: true,
      data: {
        preferences: user.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user preferences
// @route   PUT /api/user/preferences
// @access  Private
const updateUserPreferences = async (req, res, next) => {
  try {
    const {
      preferredVehicleType,
      preferredSeat,
      notifications
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        'preferences.preferredVehicleType': preferredVehicleType,
        'preferences.preferredSeat': preferredSeat,
        'preferences.notifications': notifications
      },
      {
        new: true,
        runValidators: true
      }
    ).select('preferences');

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: updatedUser.preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/user/account
// @access  Private
const deleteUserAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide your password to confirm account deletion',
          statusCode: 400
        }
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    
    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid password',
          statusCode: 401
        }
      });
    }

    // Check if user has active bookings
    const activeBookings = await Booking.countDocuments({
      user: req.user.id,
      status: { $in: ['pending', 'confirmed', 'driver_assigned', 'driver_en_route', 'driver_arrived', 'trip_started'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot delete account with active bookings. Please complete or cancel all active trips first.',
          statusCode: 400
        }
      });
    }

    // Delete user account
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserBookings,
  getUserWallet,
  addMoneyToWallet,
  getUserPreferences,
  updateUserPreferences,
  deleteUserAccount
};
