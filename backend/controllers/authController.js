const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendOTP } = require('../utils/notifications');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id, role = 'user') => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Send success response
const sendTokenResponse = (user, statusCode, res, role = 'user') => {
  const token = generateToken(user._id, role);
  
  const options = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  // Set cookie based on role
  const cookieName = role === 'admin' ? 'adminToken' : role === 'driver' ? 'driverToken' : 'token';
  res.cookie(cookieName, token, options);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: role,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture
    }
  });
};

// @desc    Send OTP for signup/login
// @route   POST /api/auth/send-otp
// @access  Public
const sendOTPForAuth = async (req, res, next) => {
  try {
    const { phone, purpose = 'signup' } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Phone number is required',
          statusCode: 400
        }
      });
    }

    // Normalize phone number
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide a valid 10-digit phone number',
          statusCode: 400
        }
      });
    }
    
    const normalizedPhone = digits.slice(-10);

    if (purpose === 'signup') {
      // Check if user already exists for signup
      const existingUser = await User.findOne({ phone: normalizedPhone });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Phone number already registered. Please login instead.',
            statusCode: 400
          }
        });
      }
    } else if (purpose === 'login') {
      // Check if user exists for login
      const existingUser = await User.findOne({ phone: normalizedPhone });
      if (!existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Phone number not registered. Please signup instead.',
            statusCode: 400
          }
        });
      }
    }

    // Check if this is a test user
    let isTestUser = false;
    let testUserDefaultOTP = null;
    
    if (purpose === 'login') {
      const user = await User.findOne({ phone: normalizedPhone });
      if (user && user.isTestUser && user.defaultOTP) {
        isTestUser = true;
        testUserDefaultOTP = user.defaultOTP;
      }
    }

    let code, expiresAt;
    
    if (isTestUser) {
      // Use default OTP for test user (permanent, no expiry)
      code = testUserDefaultOTP;
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year (effectively permanent)
      console.log(`🧪 Test user detected: ${normalizedPhone}, using default OTP: ${code}`);
    } else {
      // Generate random OTP for regular users
      code = Math.floor(100000 + Math.random() * 900000).toString();
      expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    }

    // Store OTP in temporary store
    if (!global.tempOTPStore) {
      global.tempOTPStore = new Map();
    }

    global.tempOTPStore.set(normalizedPhone, {
      code,
      expiresAt,
      attempts: 0,
      purpose,
      timestamp: new Date(),
      isTestUser: isTestUser
    });

    // Clean up expired OTPs (only for non-test users)
    for (const [key, value] of global.tempOTPStore.entries()) {
      if (!value.isTestUser && value.expiresAt < new Date()) {
        global.tempOTPStore.delete(key);
      }
    }

    // Send OTP via SMS (skip for test users)
    if (!isTestUser) {
      try {
        await sendOTP(normalizedPhone, code);
      } catch (error) {
        console.error('SMS OTP sending failed:', error);
        // Remove from store if SMS fails
        global.tempOTPStore.delete(normalizedPhone);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to send OTP. Please try again.',
            statusCode: 500
          }
        });
      }
    } else {
      console.log(`📱 Skipping SMS for test user: ${normalizedPhone}`);
    }

    res.status(200).json({
      success: true,
      message: isTestUser ? `Test user OTP ready for ${normalizedPhone}` : `OTP sent successfully to ${normalizedPhone}`,
      data: {
        phone: normalizedPhone,
        purpose,
        otp: code, // REMOVE THIS IN PRODUCTION!
        isTestUser: isTestUser
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    next(error);
  }
};

// @desc    Verify OTP and proceed with signup/login
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTPAndProceed = async (req, res, next) => {
  try {
    const { phone, otp, purpose = 'signup', userData } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Phone number and OTP are required',
          statusCode: 400
        }
      });
    }

    // Normalize phone number
    const digits = phone.replace(/[^0-9]/g, '');
    const normalizedPhone = digits.slice(-10);

    // Check if OTP exists in temporary store
    if (!global.tempOTPStore || !global.tempOTPStore.has(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'OTP not found or expired. Please request a new OTP.',
          statusCode: 400
        }
      });
    }

    const otpData = global.tempOTPStore.get(normalizedPhone);

    // Check if OTP is expired (skip expiry check for test users)
    if (!otpData.isTestUser && otpData.expiresAt < new Date()) {
      global.tempOTPStore.delete(normalizedPhone);
      return res.status(400).json({
        success: false,
        error: {
          message: 'OTP has expired. Please request a new OTP.',
          statusCode: 400
        }
      });
    }

    // Check if purpose matches
    if (otpData.purpose !== purpose) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'OTP was sent for different purpose. Please request a new OTP.',
          statusCode: 400
        }
      });
    }

    // Check if OTP matches
    if (otpData.code !== otp) {
      // Increment attempts
      otpData.attempts += 1;
      global.tempOTPStore.set(normalizedPhone, otpData);

      // Block after 3 failed attempts
      if (otpData.attempts >= 3) {
        global.tempOTPStore.delete(normalizedPhone);
        return res.status(400).json({
          success: false,
          error: {
            message: 'Too many failed attempts. Please request a new OTP.',
            statusCode: 400
          }
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid OTP. Please try again.',
          statusCode: 400
        }
      });
    }

    // OTP is valid - remove it from store (but keep test user OTPs for reuse)
    if (!otpData.isTestUser) {
      global.tempOTPStore.delete(normalizedPhone);
    } else {
      console.log(`🧪 Test user OTP verified successfully: ${normalizedPhone}`);
    }

    if (purpose === 'signup') {
      // Proceed with user creation
      if (!userData || !userData.firstName || !userData.lastName || !userData.password) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User data is required for signup',
            statusCode: 400
          }
        });
      }

      // Create user
      const userDataToSave = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: normalizedPhone,
        password: userData.password,
        gender: userData.gender || 'prefer-not-to-say',
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
        isVerified: true // User is verified after OTP verification
      };

      // Only add email if it's provided and valid
      if (userData.email && userData.email.trim()) {
        userDataToSave.email = userData.email.toLowerCase().trim();
      }

      const user = await User.create(userDataToSave);

      // Generate verification code for future use
      await user.generateVerificationCode();

      res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        data: {
          userId: user._id,
          phone: user.phone,
          email: user.email,
          isVerified: user.isVerified
        }
      });
    } else if (purpose === 'login') {
      // Find user and proceed with login
      const user = await User.findOne({ phone: normalizedPhone }).select('+password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'User not found',
            statusCode: 404
          }
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Account is deactivated. Please contact support.',
            statusCode: 401
          }
        });
      }

      // Send token response
      sendTokenResponse(user, 200, res, 'user');
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res, next) => {
  try {
    const { phone, purpose = 'signup' } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Phone number is required',
          statusCode: 400
        }
      });
    }

    // Normalize phone number
    const digits = phone.replace(/[^0-9]/g, '');
    const normalizedPhone = digits.slice(-10);

    // Check if this is a test user
    let isTestUser = false;
    let testUserDefaultOTP = null;
    
    const user = await User.findOne({ phone: normalizedPhone });
    if (user && user.isTestUser && user.defaultOTP) {
      isTestUser = true;
      testUserDefaultOTP = user.defaultOTP;
    }

    // Remove existing OTP if any (but keep test user OTPs)
    if (global.tempOTPStore && global.tempOTPStore.has(normalizedPhone)) {
      const existingOtpData = global.tempOTPStore.get(normalizedPhone);
      if (!existingOtpData.isTestUser) {
        global.tempOTPStore.delete(normalizedPhone);
      }
    }

    let code, expiresAt;
    
    if (isTestUser) {
      // Use default OTP for test user (permanent, no expiry)
      code = testUserDefaultOTP;
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year (effectively permanent)
      console.log(`🧪 Test user resend: ${normalizedPhone}, using default OTP: ${code}`);
    } else {
      // Generate new OTP for regular users
      code = Math.floor(100000 + Math.random() * 900000).toString();
      expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    }

    // Store new OTP
    if (!global.tempOTPStore) {
      global.tempOTPStore = new Map();
    }

    global.tempOTPStore.set(normalizedPhone, {
      code,
      expiresAt,
      attempts: 0,
      purpose,
      timestamp: new Date(),
      isTestUser: isTestUser
    });

    // Send new OTP (skip for test users)
    if (!isTestUser) {
      try {
        await sendOTP(normalizedPhone, code);
      } catch (error) {
        console.error('SMS OTP sending failed:', error);
        global.tempOTPStore.delete(normalizedPhone);
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to send OTP. Please try again.',
            statusCode: 500
          }
        });
      }
    } else {
      console.log(`📱 Skipping SMS resend for test user: ${normalizedPhone}`);
    }

    res.status(200).json({
      success: true,
      message: isTestUser ? `Test user OTP ready for ${normalizedPhone}` : 'OTP resent successfully',
      data: {
        phone: normalizedPhone,
        purpose,
        otp: code, // REMOVE THIS IN PRODUCTION!
        isTestUser: isTestUser
      }
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    next(error);
  }
};

// @desc    Send OTP for driver signup/login
// @route   POST /api/auth/driver/send-otp
// @access  Public
const sendDriverOTP = async (req, res, next) => {
  try {
    const { phone, purpose = 'signup' } = req.body;
    
    if (!phone) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Phone number is required',
          statusCode: 400
        }
      });
    }

    // Normalize phone number
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 10) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide a valid 10-digit phone number',
          statusCode: 400
        }
      });
    }
    
    const normalizedPhone = digits.slice(-10);

    if (purpose === 'signup') {
      // Check if driver already exists for signup
      const existingDriver = await Driver.findOne({ phone: normalizedPhone });
    if (existingDriver) {
      return res.status(400).json({
        success: false,
        error: {
            message: 'Phone number already registered. Please login instead.',
          statusCode: 400
        }
      });
      }
    } else if (purpose === 'login') {
      // Check if driver exists for login
      const existingDriver = await Driver.findOne({ phone: normalizedPhone });
      if (!existingDriver) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Phone number not registered. Please signup instead.',
            statusCode: 400
          }
        });
      }
    }

    // Check if this is a test driver
    let isTestDriver = false;
    let testDriverDefaultOTP = null;
    
    if (purpose === 'login') {
      const driver = await Driver.findOne({ phone: normalizedPhone });
      if (driver && driver.isTestUser && driver.defaultOTP) {
        isTestDriver = true;
        testDriverDefaultOTP = driver.defaultOTP;
      }
    }

    let code, expiresAt;
    
    if (isTestDriver) {
      // Use default OTP for test driver (permanent, no expiry)
      code = testDriverDefaultOTP;
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year (effectively permanent)
      console.log(`🧪 Test driver detected: ${normalizedPhone}, using default OTP: ${code}`);
    } else {
      // Generate random OTP for regular drivers
      code = Math.floor(100000 + Math.random() * 900000).toString();
      expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    }

    // Store OTP in temporary store
    if (!global.tempDriverOTPStore) {
      global.tempDriverOTPStore = new Map();
    }

    global.tempDriverOTPStore.set(normalizedPhone, {
      code,
      expiresAt,
      attempts: 0,
      purpose,
      timestamp: new Date(),
      isTestDriver: isTestDriver
    });

    // Clean up expired OTPs (only for non-test drivers)
    for (const [key, value] of global.tempDriverOTPStore.entries()) {
      if (!value.isTestDriver && value.expiresAt < new Date()) {
        global.tempDriverOTPStore.delete(key);
      }
    }

    // Send OTP via SMS (skip for test drivers)
    if (!isTestDriver) {
      try {
        await sendOTP(normalizedPhone, code);
        console.log(`📱 SMS sent successfully to ${normalizedPhone}`);
      } catch (error) {
        console.error('SMS OTP sending failed:', error);
        
        // In development mode, allow OTP to work even if SMS fails
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
          console.log(`⚠️ SMS failed but allowing OTP in development mode. OTP: ${code}`);
          // Don't remove from store, allow verification to proceed
        } else {
          // In production, remove from store if SMS fails
          global.tempDriverOTPStore.delete(normalizedPhone);
          return res.status(500).json({
            success: false,
            error: {
              message: 'Failed to send OTP. Please try again.',
              statusCode: 500
            }
          });
        }
      }
    } else {
      console.log(`📱 Skipping SMS for test driver: ${normalizedPhone}`);
    }

    res.status(200).json({
      success: true,
      message: isTestDriver ? `Test driver OTP ready for ${normalizedPhone}` : `OTP sent successfully to ${normalizedPhone}`,
      data: {
        phone: normalizedPhone,
        purpose,
        otp: code, // REMOVE THIS IN PRODUCTION!
        isTestDriver: isTestDriver,
        isDevelopment: process.env.NODE_ENV !== 'production'
      }
    });
  } catch (error) {
    console.error('Send driver OTP error:', error);
    next(error);
  }
};

// @desc    Verify OTP and proceed with driver signup/login
// @route   POST /api/auth/driver/verify-otp
// @access  Public
const verifyDriverOTPAndProceed = async (req, res, next) => {
  try {
    const { phone, otp, purpose = 'signup', driverData } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Phone number and OTP are required',
          statusCode: 400
        }
      });
    }

    // Normalize phone number
    const digits = phone.replace(/[^0-9]/g, '');
    const normalizedPhone = digits.slice(-10);

    // Check if OTP exists in temporary store
    if (!global.tempDriverOTPStore || !global.tempDriverOTPStore.has(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'OTP not found or expired. Please request a new OTP.',
          statusCode: 400
        }
      });
    }

    const otpData = global.tempDriverOTPStore.get(normalizedPhone);

    // Check if OTP is expired (skip expiry check for test drivers)
    if (!otpData.isTestDriver && otpData.expiresAt < new Date()) {
      global.tempDriverOTPStore.delete(normalizedPhone);
      return res.status(400).json({
        success: false,
        error: {
          message: 'OTP has expired. Please request a new OTP.',
          statusCode: 400
        }
      });
    }

    // Check if purpose matches
    if (otpData.purpose !== purpose) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'OTP was sent for different purpose. Please request a new OTP.',
          statusCode: 400
        }
      });
    }

    // Check if OTP matches
    if (otpData.code !== otp) {
      // Increment attempts
      otpData.attempts += 1;
      global.tempDriverOTPStore.set(normalizedPhone, otpData);

      // Block after 3 failed attempts
      if (otpData.attempts >= 3) {
        global.tempDriverOTPStore.delete(normalizedPhone);
        return res.status(400).json({
          success: false,
          error: {
            message: 'Too many failed attempts. Please request a new OTP.',
            statusCode: 400
          }
        });
      }

      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid OTP. Please try again.',
          statusCode: 400
        }
      });
    }

    // OTP is valid - remove it from store (but keep test driver OTPs for reuse)
    if (!otpData.isTestDriver) {
      global.tempDriverOTPStore.delete(normalizedPhone);
    } else {
      console.log(`🧪 Test driver OTP verified successfully: ${normalizedPhone}`);
    }

    if (purpose === 'signup') {
      // Proceed with driver creation
      if (!driverData || !driverData.firstName || !driverData.lastName || !driverData.email) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Driver data is required for signup (firstName, lastName, email)',
            statusCode: 400
          }
        });
      }

      // Create driver
      const driverDataToSave = {
        firstName: driverData.firstName,
        lastName: driverData.lastName,
        email: driverData.email.toLowerCase().trim(),
        phone: normalizedPhone,
        password: 'temp_password_123', // Temporary password, will be updated later
        gender: driverData.gender || 'male',
        dateOfBirth: driverData.dateOfBirth ? new Date(driverData.dateOfBirth) : new Date('1990-01-01'),
        address: {
          street: driverData.address?.street || 'N/A',
          city: driverData.address?.city || 'N/A',
          state: driverData.address?.state || 'N/A',
          pincode: driverData.address?.pincode || '000000',
          country: 'India'
        },
      documents: {
        drivingLicense: { number: 'PENDING', expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
        vehicleRC: { number: 'PENDING', expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
      },
      vehicleDetails: {
        type: 'car',
        brand: 'TBD',
        model: 'TBD',
        year: new Date().getFullYear(),
        color: 'TBD',
        fuelType: 'petrol',
        seatingCapacity: 4
      },
      bankDetails: {
        accountNumber: 'PENDING',
        ifscCode: 'PENDING',
        bankName: 'PENDING',
          accountHolderName: `${driverData.firstName} ${driverData.lastName}`.trim() || 'PENDING'
        },
        isVerified: true, // Driver is verified after OTP verification
        isApproved: true // Auto-approve drivers on signup
      };

      const driver = await Driver.create(driverDataToSave);

      // Generate verification code for future use
      await driver.generateVerificationCode();

      res.status(201).json({
        success: true,
        message: 'Driver account created successfully! Please wait for admin approval.',
        data: {
          driverId: driver._id,
          phone: driver.phone,
          email: driver.email,
          isVerified: driver.isVerified,
          isApproved: driver.isApproved
        }
      });
    } else if (purpose === 'login') {
      // Find driver and proceed with login
      const driver = await Driver.findOne({ phone: normalizedPhone });
      
      if (!driver) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Driver not found',
            statusCode: 404
          }
        });
      }

      // Check if driver is active
      if (!driver.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Account is deactivated. Please contact support.',
            statusCode: 401
          }
        });
      }

      // Check if driver is approved
      if (!driver.isApproved) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Account is not approved yet. Please wait for admin approval.',
            statusCode: 401
          }
        });
      }

      // Update last login
      driver.lastLogin = new Date();
      await driver.save();

      // Send token response
      sendTokenResponse(driver, 200, res, 'driver');
    }
  } catch (error) {
    console.error('Verify driver OTP error:', error);
    next(error);
  }
};

// @desc    Resend OTP for driver
// @route   POST /api/auth/driver/resend-otp
// @access  Public
const resendDriverOTP = async (req, res, next) => {
  try {
    const { phone, purpose = 'signup' } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Phone number is required',
          statusCode: 400
        }
      });
    }

    // Normalize phone number
    const digits = phone.replace(/[^0-9]/g, '');
    const normalizedPhone = digits.slice(-10);

    // Check if this is a test driver
    let isTestDriver = false;
    let testDriverDefaultOTP = null;
    
    const driver = await Driver.findOne({ phone: normalizedPhone });
    if (driver && driver.isTestUser && driver.defaultOTP) {
      isTestDriver = true;
      testDriverDefaultOTP = driver.defaultOTP;
    }

    // Remove existing OTP if any (but keep test driver OTPs)
    if (global.tempDriverOTPStore && global.tempDriverOTPStore.has(normalizedPhone)) {
      const existingOtpData = global.tempDriverOTPStore.get(normalizedPhone);
      if (!existingOtpData.isTestDriver) {
        global.tempDriverOTPStore.delete(normalizedPhone);
      }
    }

    let code, expiresAt;
    
    if (isTestDriver) {
      // Use default OTP for test driver (permanent, no expiry)
      code = testDriverDefaultOTP;
      expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year (effectively permanent)
      console.log(`🧪 Test driver resend: ${normalizedPhone}, using default OTP: ${code}`);
    } else {
      // Generate new OTP for regular drivers
      code = Math.floor(100000 + Math.random() * 900000).toString();
      expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    }

    // Store new OTP
    if (!global.tempDriverOTPStore) {
      global.tempDriverOTPStore = new Map();
    }

    global.tempDriverOTPStore.set(normalizedPhone, {
      code,
      expiresAt,
      attempts: 0,
      purpose,
      timestamp: new Date(),
      isTestDriver: isTestDriver
    });

    // Send new OTP (skip for test drivers)
    if (!isTestDriver) {
      try {
        await sendOTP(normalizedPhone, code);
        console.log(`📱 SMS resent successfully to ${normalizedPhone}`);
      } catch (error) {
        console.error('SMS OTP sending failed:', error);
        
        // In development mode, allow OTP to work even if SMS fails
        if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
          console.log(`⚠️ SMS failed but allowing OTP in development mode. OTP: ${code}`);
          // Don't remove from store, allow verification to proceed
        } else {
          // In production, remove from store if SMS fails
          global.tempDriverOTPStore.delete(normalizedPhone);
          return res.status(500).json({
            success: false,
            error: {
              message: 'Failed to send OTP. Please try again.',
              statusCode: 500
            }
          });
        }
      }
    } else {
      console.log(`📱 Skipping SMS resend for test driver: ${normalizedPhone}`);
    }

    res.status(200).json({
      success: true,
      message: isTestDriver ? `Test driver OTP ready for ${normalizedPhone}` : 'OTP resent successfully',
      data: {
        phone: normalizedPhone,
        purpose,
        otp: code, // REMOVE THIS IN PRODUCTION!
        isTestDriver: isTestDriver,
        isDevelopment: process.env.NODE_ENV !== 'production'
      }
    });
  } catch (error) {
    console.error('Resend driver OTP error:', error);
    next(error);
  }
};

// @desc    Driver login
// @route   POST /api/auth/driver/login
// @access  Public
const loginDriver = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    
    console.log('Driver login attempt:', { phone, hasPassword: !!password });

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide phone number and password',
          statusCode: 400
        }
      });
    }

    // Normalize phone number to match how it's stored
    const normalizedPhone = String(phone).replace(/[^0-9]/g, '').slice(-10);
    console.log('Normalized phone:', normalizedPhone);

    const driver = await Driver.findOne({ phone: normalizedPhone }).select('+password');
    console.log('Driver found:', !!driver, driver ? { 
      id: driver._id, 
      firstName: driver.firstName, 
      lastName: driver.lastName,
      isVerified: driver.isVerified,
      isApproved: driver.isApproved,
      isActive: driver.isActive,
      hasPassword: !!driver.password
    } : null);
    
    if (!driver) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          statusCode: 401
        }
      });
    }

    if (driver.isLocked()) {
      return res.status(423).json({
        success: false,
        error: {
          message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
          statusCode: 423
        }
      });
    }

    const isMatch = await driver.matchPassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      await driver.incLoginAttempts();
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          statusCode: 401
        }
      });
    }

    await driver.resetLoginAttempts();
    driver.lastLogin = new Date();
    await driver.save();

    // For admin-registered drivers, skip OTP verification if they are already verified and approved
    if (!driver.isVerified || !driver.isApproved) {
      console.log('Driver not verified/approved:', { isVerified: driver.isVerified, isApproved: driver.isApproved });
      return res.status(401).json({
        success: false,
        error: {
          message: 'Account is not verified or approved. Please contact your admin.',
          statusCode: 401
        }
      });
    }

    if (!driver.isActive) {
      console.log('Driver not active:', driver.isActive);
      return res.status(401).json({
        success: false,
        error: {
          message: 'Account is deactivated. Please contact support.',
          statusCode: 401
        }
      });
    }

    console.log('Driver login successful, sending token');
    sendTokenResponse(driver, 200, res, 'driver');
  } catch (error) {
    console.error('Driver login error:', error);
    next(error);
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide email and password',
          statusCode: 400
        }
      });
    }

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          statusCode: 401
        }
      });
    }

    if (admin.isLocked()) {
      return res.status(423).json({
        success: false,
        error: {
          message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
          statusCode: 423
        }
      });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      await admin.incLoginAttempts();
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          statusCode: 401
        }
      });
    }

    await admin.resetLoginAttempts();
    admin.lastLogin = new Date();
    await admin.save();

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Account is deactivated. Please contact support.',
          statusCode: 401
        }
      });
    }

    // Log admin activity
    admin.logActivity('login', 'Admin logged in successfully', req.ip, req.get('User-Agent'));

    sendTokenResponse(admin, 200, res, 'admin');
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    const role = req.user ? 'user' : req.driver ? 'driver' : req.admin ? 'admin' : 'user';
    const cookieName = role === 'admin' ? 'adminToken' : role === 'driver' ? 'driverToken' : 'token';
    
    res.cookie(cookieName, 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = req.user || req.driver || req.admin;
    const role = req.user ? 'user' : req.driver ? 'driver' : 'admin';

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: role,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendOTPForAuth,
  verifyOTPAndProceed,
  resendOTP,
  sendDriverOTP,
  verifyDriverOTPAndProceed,
  resendDriverOTP,
  loginDriver,
  loginAdmin,
  logout,
  getMe
};
