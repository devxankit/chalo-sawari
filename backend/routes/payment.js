const express = require('express');
const { body, param, query } = require('express-validator');
const {
  testPaymentEndpoint,
  createRazorpayOrder,
  verifyRazorpayPayment,
  processPayment,
  getPaymentHistory,
  getPaymentById,
  refundPayment,
  addMoneyToWallet,
  getWalletBalance,
  getWalletTransactions,
  getAllPayments,
  getPaymentStats,
  testRazorpayConfig,
  linkPaymentToBooking,
  updateCashPaymentStatus
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Test endpoint (public)
router.get('/test', testPaymentEndpoint);

// Apply authentication middleware to all routes
router.use(protect);

// Razorpay routes
router.get('/test-config', testRazorpayConfig);
router.post('/create-order', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('receipt').optional().isString().withMessage('Receipt must be a string'),
  body('notes').optional().isObject().withMessage('Notes must be an object')
], validate, createRazorpayOrder);

router.post('/verify', [
  body('razorpayOrderId').isString().withMessage('Razorpay order ID is required'),
  body('razorpayPaymentId').isString().withMessage('Razorpay payment ID is required'),
  body('razorpaySignature').isString().withMessage('Razorpay signature is required'),
  body('bookingId').optional().isString().withMessage('Invalid booking ID format'),
  body('amount').isNumeric().withMessage('Amount must be a valid number'),
  body('paymentMethod').isIn(['razorpay', 'cash', 'card', 'upi', 'netbanking', 'wallet', 'emi']).withMessage('Invalid payment method'),
  body('currency').optional().isString().withMessage('Currency must be a string')
], validate, verifyRazorpayPayment);

// Process payment (legacy)
router.post('/process', [
  body('bookingId').isMongoId().withMessage('Invalid booking ID'),
  body('paymentMethod').isIn(['wallet', 'card', 'upi', 'cash']).withMessage('Invalid payment method'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('paymentDetails').isObject().withMessage('Payment details must be an object')
], validate, processPayment);

// Admin payment management routes
router.get('/admin/all', getAllPayments);
router.get('/admin/stats', getPaymentStats);

// Get payment history
router.get('/history', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded']).withMessage('Invalid status')
], validate, getPaymentHistory);

// Get payment by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid payment ID')
], validate, getPaymentById);

// Refund payment
router.post('/:id/refund', [
  param('id').isMongoId().withMessage('Invalid payment ID'),
  body('reason').isString().withMessage('Refund reason is required')
], validate, refundPayment);

// Wallet routes
router.post('/wallet/add', [
  body('amount').isFloat({ min: 100, max: 10000 }).withMessage('Amount must be between ₹100 and ₹10,000'),
  body('paymentMethod').isIn(['card', 'upi']).withMessage('Invalid payment method for wallet recharge'),
  body('paymentDetails').isObject().withMessage('Payment details must be an object')
], validate, addMoneyToWallet);

router.get('/wallet/balance', getWalletBalance);

router.get('/wallet/transactions', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['credit', 'debit']).withMessage('Invalid transaction type')
], validate, getWalletTransactions);

// Payment linking and status update routes
router.post('/link-booking', [
  body('paymentId').isMongoId().withMessage('Invalid payment ID'),
  body('bookingId').isMongoId().withMessage('Invalid booking ID')
], validate, linkPaymentToBooking);

router.put('/cash-collected', [
  body('bookingId').isMongoId().withMessage('Invalid booking ID')
], validate, updateCashPaymentStatus);

module.exports = router;
