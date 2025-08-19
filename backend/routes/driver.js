const express = require('express');
const { body, param, query } = require('express-validator');
const {
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
} = require('../controllers/driverController');
const { protectDriver } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protectDriver);

// Profile routes
router.get('/profile', getDriverProfile);
router.put('/profile', [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('phone').optional().isMobilePhone('en-IN').withMessage('Please provide a valid Indian phone number'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('dateOfBirth').optional().isISO8601().withMessage('Please provide a valid date'),
  body('address').optional(),
  body('emergencyContact').optional()
], validate, updateDriverProfile);

// Location and status routes
router.put('/location', [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('address').optional().isString().withMessage('Address must be a string')
], validate, updateLocation);

router.put('/status', toggleStatus);

// Earnings and statistics routes
router.get('/earnings', [
  query('period').optional().isIn(['week', 'month', 'year']).withMessage('Period must be week, month, or year'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid date')
], validate, getEarnings);

router.get('/stats', getDriverStats);

// Booking routes
router.get('/bookings', [
  query('status').optional().isIn(['pending', 'accepted', 'started', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validate, getDriverBookings);

router.put('/bookings/:id/status', [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('status').isIn(['accepted', 'started', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('actualDistance').optional().isFloat({ min: 0 }).withMessage('Actual distance must be a positive number'),
  body('actualDuration').optional().isFloat({ min: 0 }).withMessage('Actual duration must be a positive number')
], validate, updateBookingStatus);

// Vehicle routes
router.get('/vehicles', getDriverVehicle);
router.put('/vehicles', [
  body('brand').optional().isString().withMessage('Brand must be a string'),
  body('model').optional().isString().withMessage('Model must be a string'),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() }).withMessage('Invalid year'),
  body('color').optional().isString().withMessage('Color must be a string'),
  body('fuelType').optional().isIn(['petrol', 'diesel', 'electric', 'hybrid', 'cng']).withMessage('Invalid fuel type'),
  body('seatingCapacity').optional().isInt({ min: 1, max: 20 }).withMessage('Seating capacity must be between 1 and 20'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('pricingReference.category').optional().isIn(['auto', 'car', 'bus']).withMessage('Invalid vehicle category'),
  body('pricingReference.vehicleType').optional().isString().withMessage('Vehicle type must be a string'),
  body('pricingReference.vehicleModel').optional().isString().withMessage('Vehicle model must be a string')
], validate, updateVehicle);

// Document routes
router.get('/documents', getDocuments);
router.put('/documents', [
  body('documents.license').optional().isObject().withMessage('License must be an object'),
  body('documents.rcBook').optional().isObject().withMessage('RC Book must be an object'),
  body('documents.insurance').optional().isObject().withMessage('Insurance must be an object'),
  body('documents.puc').optional().isObject().withMessage('PUC must be an object'),
  body('documents.fitness').optional().isObject().withMessage('Fitness must be an object'),
  body('documents.permit').optional().isObject().withMessage('Permit must be an object')
], validate, updateDocuments);

// Wallet and withdrawal routes
router.post('/withdraw', [
  body('amount').isFloat({ min: 100 }).withMessage('Minimum withdrawal amount is ₹100'),
  body('bankDetails.accountNumber').isString().withMessage('Account number is required'),
  body('bankDetails.ifscCode').isString().withMessage('IFSC code is required'),
  body('bankDetails.accountHolderName').isString().withMessage('Account holder name is required'),
  body('bankDetails.bankName').isString().withMessage('Bank name is required')
], validate, requestWithdrawal);

module.exports = router;
