const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAllPayments,
  getPaymentStats,
  getPaymentById,
  processRefund,
  getRazorpayDetails,
  exportPayments
} = require('../controllers/adminPaymentController');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// Get all payments with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled']).withMessage('Invalid status'),
  query('paymentMethod').optional().isIn(['card', 'upi', 'netbanking', 'wallet', 'emi', 'cash']).withMessage('Invalid payment method'),
  query('paymentGateway').optional().isIn(['razorpay', 'stripe', 'paytm', 'internal']).withMessage('Invalid payment gateway'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  query('search').optional().isString().withMessage('Search must be a string')
], validate, getAllPayments);

// Get payment statistics
router.get('/stats', [
  query('period').optional().isIn(['week', 'month', 'year']).withMessage('Period must be week, month, or year')
], validate, getPaymentStats);

// Get payment by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid payment ID')
], validate, getPaymentById);

// Process refund
router.post('/:id/refund', [
  param('id').isMongoId().withMessage('Invalid payment ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('reason').isString().withMessage('Refund reason is required')
], validate, processRefund);

// Get Razorpay payment details
router.get('/:id/razorpay-details', [
  param('id').isMongoId().withMessage('Invalid payment ID')
], validate, getRazorpayDetails);

// Export payments data
router.get('/export/data', [
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled']).withMessage('Invalid status'),
  query('paymentMethod').optional().isIn(['card', 'upi', 'netbanking', 'wallet', 'emi', 'cash']).withMessage('Invalid payment method')
], validate, exportPayments);

module.exports = router;
