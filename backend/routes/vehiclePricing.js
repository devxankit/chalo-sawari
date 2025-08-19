const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAllVehiclePricing,
  getVehiclePricingById,
  createVehiclePricing,
  updateVehiclePricing,
  deleteVehiclePricing,
  bulkUpdateVehiclePricing,
  getPricingForCalculation,
  calculateFare,
  getPricingForVehicle,
  getPricingCategories
} = require('../controllers/vehiclePricingController');
const { protectAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();



// Public routes (no authentication required)
router.get('/categories', getPricingCategories);
router.get('/vehicle/:vehicleId', [
  param('vehicleId').isMongoId().withMessage('Invalid vehicle ID')
], validate, getPricingForVehicle);
router.get('/calculate', [
  query('category').isIn(['auto', 'car', 'bus']).withMessage('Invalid category'),
  query('vehicleType').notEmpty().withMessage('Vehicle type is required'),
  query('vehicleModel').optional().isString().withMessage('Vehicle model must be a string'),
  query('tripType').optional().isIn(['one-way', 'return']).withMessage('Invalid trip type')
], validate, getPricingForCalculation);

router.post('/calculate-fare', [
  body('category').isIn(['auto', 'car', 'bus']).withMessage('Invalid category'),
  body('vehicleType').notEmpty().withMessage('Vehicle type is required'),
  body('vehicleModel').optional().isString().withMessage('Vehicle model must be a string'),
  body('tripType').optional().isIn(['one-way', 'return']).withMessage('Invalid trip type'),
  body('distance').isFloat({ min: 0 }).withMessage('Distance must be a positive number'),
  body('additionalServices').optional().isArray().withMessage('Additional services must be an array')
], validate, calculateFare);

// Admin routes (authentication required)
router.get('/admin', protectAdmin, [
  query('category').optional().isIn(['auto', 'car', 'bus']).withMessage('Invalid category'),
  query('tripType').optional().isIn(['one-way', 'return']).withMessage('Invalid trip type'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validate, getAllVehiclePricing);

router.get('/admin/:id', protectAdmin, [
  param('id').isMongoId().withMessage('Invalid pricing ID')
], validate, getVehiclePricingById);

router.post('/admin', protectAdmin, [
  body('category').isIn(['auto', 'car', 'bus']).withMessage('Invalid category'),
  body('vehicleType').notEmpty().withMessage('Vehicle type is required'),
  body('vehicleModel').notEmpty().withMessage('Vehicle model is required'),
  body('tripType').isIn(['one-way', 'return']).withMessage('Invalid trip type'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('distancePricing.50km').custom((value, { req }) => {
    if (req.body.category !== 'auto' && (value === undefined || value === null || value < 0)) {
      throw new Error('50km pricing is required for car and bus categories');
    }
    return true;
  }),
  body('distancePricing.100km').custom((value, { req }) => {
    if (req.body.category !== 'auto' && (value === undefined || value === null || value < 0)) {
      throw new Error('100km pricing is required for car and bus categories');
    }
    return true;
  }),
  body('distancePricing.150km').custom((value, { req }) => {
    if (req.body.category !== 'auto' && (value === undefined || value === null || value < 0)) {
      throw new Error('150km pricing is required for car and bus categories');
    }
    return true;
  }),
  body('distancePricing.200km').custom((value, { req }) => {
    if (req.body.category !== 'auto' && (value === undefined || value === null || value < 0)) {
      throw new Error('200km pricing is required for car and bus categories');
    }
    return true;
  }),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean')
], validate, createVehiclePricing);

router.put('/admin/:id', protectAdmin, [
  param('id').isMongoId().withMessage('Invalid pricing ID'),
  body('basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('distancePricing.50km').optional().isFloat({ min: 0 }).withMessage('50km pricing must be a positive number'),
  body('distancePricing.100km').optional().isFloat({ min: 0 }).withMessage('100km pricing must be a positive number'),
  body('distancePricing.150km').optional().isFloat({ min: 0 }).withMessage('150km pricing must be a positive number'),
  body('distancePricing.200km').optional().isFloat({ min: 0 }).withMessage('200km pricing must be a positive number'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], validate, updateVehiclePricing);

router.delete('/admin/:id', protectAdmin, [
  param('id').isMongoId().withMessage('Invalid pricing ID')
], validate, deleteVehiclePricing);

router.post('/admin/bulk', protectAdmin, [
  body('pricingData').isArray().withMessage('pricingData must be an array'),
  body('pricingData.*.category').isIn(['auto', 'car', 'bus']).withMessage('Invalid category'),
  body('pricingData.*.vehicleType').notEmpty().withMessage('Vehicle type is required'),
  body('pricingData.*.vehicleModel').notEmpty().withMessage('Vehicle model is required'),
  body('pricingData.*.tripType').isIn(['one-way', 'return']).withMessage('Invalid trip type'),
  body('pricingData.*.basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('pricingData.*.distancePricing.50km').custom((value, { req, path }) => {
    const index = path.split('.')[1];
    const category = req.body.pricingData[index]?.category;
    if (category !== 'auto' && (value === undefined || value === null || value < 0)) {
      throw new Error('50km pricing is required for car and bus categories');
    }
    return true;
  }),
  body('pricingData.*.distancePricing.100km').custom((value, { req, path }) => {
    const index = path.split('.')[1];
    const category = req.body.pricingData[index]?.category;
    if (category !== 'auto' && (value === undefined || value === null || value < 0)) {
      throw new Error('100km pricing is required for car and bus categories');
    }
    return true;
  }),
  body('pricingData.*.distancePricing.150km').custom((value, { req, path }) => {
    const index = path.split('.')[1];
    const category = req.body.pricingData[index]?.category;
    if (category !== 'auto' && (value === undefined || value === null || value < 0)) {
      throw new Error('150km pricing is required for car and bus categories');
    }
    return true;
  }),
  body('pricingData.*.distancePricing.200km').custom((value, { req, path }) => {
    const index = path.split('.')[1];
    const category = req.body.pricingData[index]?.category;
    if (category !== 'auto' && (value === undefined || value === null || value < 0)) {
      throw new Error('200km pricing is required for car and bus categories');
    }
    return true;
  })
], validate, bulkUpdateVehiclePricing);

module.exports = router;
