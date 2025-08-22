const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createBooking,
  getBookingReceipt,
  cancelBooking,
  updateBookingStatus,
  collectCashPayment,
  testPuppeteer
} = require('../controllers/bookingController');
const { protect, protectDriver } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Apply authentication middleware to specific routes that need general user protection

// Test Puppeteer endpoint
router.get('/test-puppeteer', testPuppeteer);

// Create new booking
router.post('/', [
  body('vehicleId').isMongoId().withMessage('Invalid vehicle ID'),
  body('pickup').isObject().withMessage('Pickup must be an object'),
  body('pickup.latitude').isFloat({ min: -90, max: 90 }).withMessage('Pickup latitude must be between -90 and 90'),
  body('pickup.longitude').isFloat({ min: -180, max: 180 }).withMessage('Pickup longitude must be between -180 and 90'),
  body('pickup.address').isString().withMessage('Pickup address is required'),
  body('destination').isObject().withMessage('Destination must be an object'),
  body('destination.latitude').isFloat({ min: -90, max: 90 }).withMessage('Destination latitude must be between -90 and 90'),
  body('destination.longitude').isFloat({ min: -180, max: 180 }).withMessage('Destination longitude must be between -180 and 180'),
  body('destination.address').isString().withMessage('Destination address is required'),
  body('date').isString().withMessage('Date is required'),
  body('time').isString().withMessage('Time is required'),
  body('tripType').optional().isIn(['one-way', 'return']).withMessage('Invalid trip type'),
  body('passengers').optional().isInt({ min: 1, max: 20 }).withMessage('Passengers must be between 1 and 20'),
  body('specialRequests').optional().isString().withMessage('Special requests must be a string'),
  body('paymentMethod').isIn(['cash', 'upi', 'netbanking', 'card', 'razorpay']).withMessage('Invalid payment method')
], validate, protect, createBooking);

// Get booking receipt
router.get('/:id/receipt', protect, getBookingReceipt);

// Cancel booking
router.put('/:id/cancel', [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], validate, protect, cancelBooking);

// Update booking status
router.put('/:id/status', [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('status').isIn(['pending', 'accepted', 'started', 'completed', 'cancelled']).withMessage('Invalid status')
], validate, protect, updateBookingStatus);

// Collect cash payment (for partial payment bookings)
router.put('/:id/collect-cash-payment', [
  param('id').isMongoId().withMessage('Invalid booking ID')
], validate, protectDriver, collectCashPayment);

module.exports = router;
