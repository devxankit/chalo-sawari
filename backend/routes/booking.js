const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
  rateBooking,
  addMessage,
  getBookingMessages
} = require('../controllers/bookingController');
const { protect, protectDriver } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Create new booking
router.post('/', [
  body('vehicleId').isMongoId().withMessage('Invalid vehicle ID'),
  body('pickup').isObject().withMessage('Pickup must be an object'),
  body('pickup.latitude').isFloat({ min: -90, max: 90 }).withMessage('Pickup latitude must be between -90 and 90'),
  body('pickup.longitude').isFloat({ min: -180, max: 180 }).withMessage('Pickup longitude must be between -180 and 180'),
  body('pickup.address').isString().withMessage('Pickup address is required'),
  body('destination').isObject().withMessage('Destination must be an object'),
  body('destination.latitude').isFloat({ min: -90, max: 90 }).withMessage('Destination latitude must be between -90 and 90'),
  body('destination.longitude').isFloat({ min: -180, max: 180 }).withMessage('Destination longitude must be between -180 and 180'),
  body('destination.address').isString().withMessage('Destination address is required'),
  body('date').isISO8601().withMessage('Date must be a valid date'),
  body('time').isISO8601().withMessage('Time must be a valid time'),
  body('passengers').isInt({ min: 1, max: 20 }).withMessage('Passengers must be between 1 and 20'),
  body('specialRequests').optional().isString().withMessage('Special requests must be a string'),
  body('paymentMethod').isIn(['wallet', 'cash', 'card', 'upi']).withMessage('Invalid payment method')
], validate, createBooking);

// Get user bookings
router.get('/', [
  query('status').optional().isIn(['pending', 'accepted', 'started', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validate, getUserBookings);

// Get booking by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid booking ID')
], validate, getBookingById);

// Cancel booking
router.put('/:id/cancel', [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('reason').isString().withMessage('Cancellation reason is required')
], validate, cancelBooking);

// Update booking status
router.put('/:id/status', [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('status').isIn(['pending', 'accepted', 'started', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], validate, updateBookingStatus);

// Rate booking
router.post('/:id/rate', [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('driverRating').isFloat({ min: 1, max: 5 }).withMessage('Driver rating must be between 1 and 5'),
  body('vehicleRating').isFloat({ min: 1, max: 5 }).withMessage('Vehicle rating must be between 1 and 5'),
  body('comment').optional().isString().withMessage('Comment must be a string')
], validate, rateBooking);

// Add message to booking
router.post('/:id/messages', [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('message').isString().withMessage('Message is required')
], validate, addMessage);

// Get booking messages
router.get('/:id/messages', [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validate, getBookingMessages);

module.exports = router;
