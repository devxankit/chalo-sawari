const express = require('express');
const { body, param, query } = require('express-validator');
const {
  processPayment,
  getPaymentHistory,
  getPaymentById,
  refundPayment,
  addMoneyToWallet,
  getWalletBalance,
  getWalletTransactions
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Process payment
router.post('/process', [
  body('bookingId').isMongoId().withMessage('Invalid booking ID'),
  body('paymentMethod').isIn(['wallet', 'card', 'upi', 'cash']).withMessage('Invalid payment method'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('paymentDetails').isObject().withMessage('Payment details must be an object')
], validate, processPayment);

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

module.exports = router;
