const express = require('express');
const { body } = require('express-validator');
const {
  sendOTPForAuth,
  verifyOTPAndProceed,
  resendOTP,
  registerDriver,
  loginDriver,
  loginAdmin,
  logout,
  getMe
} = require('../controllers/authController');
const { protect, protectDriver, protectAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Validation rules
const phoneValidation = [
  body('phone')
    .custom((value) => {
      // Remove country code if present
      const digits = value.replace(/[^0-9]/g, '');
      if (digits.length === 10) return true;
      if (digits.length > 10 && digits.slice(-10).match(/^[0-9]{10}$/)) return true;
      throw new Error('Please provide a valid 10-digit phone number');
    })
    .withMessage('Please provide a valid 10-digit phone number')
];

const otpValidation = [
  body('phone')
    .custom((value) => {
      const digits = value.replace(/[^0-9]/g, '');
      if (digits.length === 10) return true;
      if (digits.length > 10 && digits.slice(-10).match(/^[0-9]{10}$/)) return true;
      throw new Error('Please provide a valid 10-digit phone number');
    })
    .withMessage('Please provide a valid 10-digit phone number'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  body('purpose')
    .isIn(['signup', 'login'])
    .withMessage('Purpose must be either signup or login')
];

const userDataValidation = [
  body('userData.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('userData.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('userData.password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('userData.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('userData.gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
    .withMessage('Please provide a valid gender'),
  body('userData.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
];

const driverRegistrationValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please provide a valid 10-digit phone number'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const adminLoginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Public routes
router.post('/send-otp', phoneValidation, validate, sendOTPForAuth);
router.post('/verify-otp', otpValidation, validate, verifyOTPAndProceed);
router.post('/resend-otp', phoneValidation, validate, resendOTP);

// Driver routes
router.post('/driver/register', driverRegistrationValidation, validate, registerDriver);
router.post('/driver/login', loginValidation, validate, loginDriver);

// Admin routes
router.post('/admin/login', adminLoginValidation, validate, loginAdmin);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
