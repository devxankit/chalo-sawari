const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getActiveOffers,
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
  getOfferStats
} = require('../controllers/offerController');
const { protectAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadOfferImageWithErrorHandling } = require('../utils/imageUpload');

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getActiveOffers);

// Admin routes (authentication required)
router.use('/admin', protectAdmin);

// Get offer statistics
router.get('/admin/stats', getOfferStats);

// Get all offers with pagination and search
router.get('/admin', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status')
], validate, getAllOffers);

// Get offer by ID
router.get('/admin/:id', [
  param('id').isMongoId().withMessage('Invalid offer ID')
], validate, getOfferById);

// Create new offer
router.post('/admin', [
  uploadOfferImageWithErrorHandling,
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters')
], validate, createOffer);

// Update offer
router.put('/admin/:id', [
  param('id').isMongoId().withMessage('Invalid offer ID'),
  uploadOfferImageWithErrorHandling,
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters')
], validate, updateOffer);

// Delete offer
router.delete('/admin/:id', [
  param('id').isMongoId().withMessage('Invalid offer ID')
], validate, deleteOffer);

// Toggle offer status
router.patch('/admin/:id/status', [
  param('id').isMongoId().withMessage('Invalid offer ID')
], validate, toggleOfferStatus);

module.exports = router;
