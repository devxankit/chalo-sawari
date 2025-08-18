const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createVehicle,
  getDriverVehicles,
  updateVehicle,
  deleteVehicle,
  uploadVehicleImages,
  removeVehicleImage,
  searchVehicles,
  getVehicleById,
  getVehicleTypes,
  getNearbyVehicles,
  estimateFare,
  getVehicleReviews,
  updateVehicleLocation,
  updateVehicleAvailability,
  getVehicleMaintenance,
  addMaintenanceRecord,
  getVehicleAuto,
  getVehicleBus,
  getVehicleCar
} = require('../controllers/vehicleController');
const { protectDriver } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadMultiple } = require('../utils/imageUpload');

const router = express.Router();

// Driver vehicle management routes (require authentication)
router.post('/', [
  protectDriver,
  body('type').isIn(['bus', 'car', 'auto']).withMessage('Invalid vehicle type'),
  body('brand').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Brand must be between 1 and 50 characters'),
  body('model').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Model must be between 1 and 50 characters'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
  body('color').isString().trim().isLength({ min: 1, max: 30 }).withMessage('Color must be between 1 and 30 characters'),
  body('fuelType').isIn(['petrol', 'diesel', 'cng', 'electric', 'hybrid']).withMessage('Invalid fuel type'),
  body('transmission').optional().isIn(['manual', 'automatic']).withMessage('Invalid transmission type'),
  body('seatingCapacity').isInt({ min: 1, max: 100 }).withMessage('Seating capacity must be between 1 and 100'),
  body('engineCapacity').optional().isInt({ min: 0 }).withMessage('Engine capacity cannot be negative'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('Mileage cannot be negative'),
  body('isAc').optional().isBoolean().withMessage('isAc must be a boolean'),
  body('isSleeper').optional().isBoolean().withMessage('isSleeper must be a boolean'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('registrationNumber').isString().trim().isLength({ min: 5, max: 20 }).withMessage('Registration number must be between 5 and 20 characters'),
  body('chassisNumber').optional().isString().trim().withMessage('Chassis number must be a string'),
  body('engineNumber').optional().isString().trim().withMessage('Engine number must be a string'),
  body('rcNumber').isString().trim().withMessage('RC number is required'),
  body('rcExpiryDate').isISO8601().withMessage('RC expiry date must be a valid date'),
  body('insuranceNumber').optional().isString().trim().withMessage('Insurance number must be a string'),
  body('insuranceExpiryDate').optional().isISO8601().withMessage('Insurance expiry date must be a valid date'),
  body('fitnessNumber').optional().isString().trim().withMessage('Fitness number must be a string'),
  body('fitnessExpiryDate').optional().isISO8601().withMessage('Fitness expiry date must be a valid date'),
  body('permitNumber').optional().isString().trim().withMessage('Permit number must be a string'),
  body('permitExpiryDate').optional().isISO8601().withMessage('Permit expiry date must be a valid date'),
  body('pucNumber').optional().isString().trim().withMessage('PUC number must be a string'),
  body('pucExpiryDate').optional().isISO8601().withMessage('PUC expiry date must be a valid date'),
  body('baseFare').optional().isFloat({ min: 0 }).withMessage('Base fare must be a positive number'),
  body('perKmRate').optional().isFloat({ min: 0 }).withMessage('Per km rate must be a positive number'),
  body('workingDays').optional().isArray().withMessage('Working days must be an array'),
  body('workingHoursStart').optional().isString().withMessage('Working hours start must be a string'),
  body('workingHoursEnd').optional().isString().withMessage('Working hours end must be a string'),
  body('operatingCities').optional().isArray().withMessage('Operating cities must be an array'),
  body('operatingStates').optional().isArray().withMessage('Operating states must be an array')
], validate, createVehicle);




// GET /api/vehicles/auto
router.get('/auto', getVehicleAuto);
router.get('/bus', getVehicleBus);
router.get('/car', getVehicleCar);





router.get('/driver/my-vehicles', [
  protectDriver,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['all', 'active', 'inactive', 'maintenance']).withMessage('Invalid status'),
  query('type').optional().isIn(['all', 'bus', 'car', 'auto']).withMessage('Invalid vehicle type')
], validate, getDriverVehicles);

router.put('/:id', [
  protectDriver,
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  body('type').optional().isIn(['bus', 'car', 'auto']).withMessage('Invalid vehicle type'),
  body('brand').optional().isString().trim().isLength({ min: 1, max: 50 }).withMessage('Brand must be between 1 and 50 characters'),
  body('model').optional().isString().trim().isLength({ min: 1, max: 50 }).withMessage('Model must be between 1 and 50 characters'),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
  body('color').optional().isString().trim().isLength({ min: 1, max: 30 }).withMessage('Color must be between 1 and 30 characters'),
  body('fuelType').optional().isIn(['petrol', 'diesel', 'cng', 'electric', 'hybrid']).withMessage('Invalid fuel type'),
  body('transmission').optional().isIn(['manual', 'automatic']).withMessage('Invalid transmission type'),
  body('seatingCapacity').optional().isInt({ min: 1, max: 100 }).withMessage('Seating capacity must be between 1 and 50 characters'),
  body('engineCapacity').optional().isInt({ min: 0 }).withMessage('Engine capacity cannot be negative'),
  body('mileage').optional().isInt({ min: 0 }).withMessage('Mileage cannot be negative'),
  body('isAc').optional().isBoolean().withMessage('isAc must be a boolean'),
  body('isSleeper').optional().isBoolean().withMessage('isSleeper must be a boolean'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('registrationNumber').optional().isString().trim().isLength({ min: 5, max: 20 }).withMessage('Registration number must be between 5 and 20 characters'),
  body('chassisNumber').optional().isString().trim().withMessage('Chassis number must be a string'),
  body('engineNumber').optional().isString().trim().withMessage('Engine number must be a string'),
  body('baseFare').optional().isFloat({ min: 0 }).withMessage('Base fare must be a positive number'),
  body('perKmRate').optional().isFloat({ min: 0 }).withMessage('Per km rate must be a positive number'),
  body('workingDays').optional().isArray().withMessage('Working days must be an array'),
  body('workingHoursStart').optional().isString().withMessage('Working hours start must be a string'),
  body('workingHoursEnd').optional().isString().withMessage('Working hours end must be a string'),
  body('operatingCities').optional().isArray().withMessage('Operating cities must be an array'),
  body('operatingStates').optional().isArray().withMessage('Operating states must be an array')
], validate, updateVehicle);

router.delete('/:id', [
  protectDriver,
  param('id').isMongoId().withMessage('Invalid vehicle ID')
], validate, deleteVehicle);

router.post('/:id/images', [
  protectDriver,
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  uploadMultiple
], validate, uploadVehicleImages);

router.delete('/:id/images/:imageId', [
  protectDriver,
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  param('imageId').isMongoId().withMessage('Invalid image ID')
], validate, removeVehicleImage);

// Public routes
router.get('/search', [
  query('pickup').optional().isString().withMessage('Pickup must be a string'),
  query('destination').optional().isString().withMessage('Destination must be a string'),
  query('date').optional().isISO8601().withMessage('Date must be a valid date'),
  query('passengers').optional().isInt({ min: 1, max: 20 }).withMessage('Passengers must be between 1 and 20'),
  query('vehicleType').optional().isIn(['car', 'bike', 'auto', 'bus', 'truck']).withMessage('Invalid vehicle type'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validate, searchVehicles);

router.get('/types', getVehicleTypes);

router.get('/nearby', [
  query('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  query('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  query('radius').optional().isFloat({ min: 0.1, max: 100 }).withMessage('Radius must be between 0.1 and 100 km'),
  query('vehicleType').optional().isIn(['car', 'bike', 'auto', 'bus', 'truck']).withMessage('Invalid vehicle type'),
  query('passengers').optional().isInt({ min: 1, max: 20 }).withMessage('Passengers must be between 1 and 20')
], validate, getNearbyVehicles);

router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid vehicle ID')
], validate, getVehicleById);

router.get('/:id/reviews', [
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validate, getVehicleReviews);

router.post('/estimate-fare', [
  body('vehicleId').isMongoId().withMessage('Invalid vehicle ID'),
  body('pickup').isObject().withMessage('Pickup must be an object'),
  body('pickup.latitude').isFloat({ min: -90, max: 90 }).withMessage('Pickup latitude must be between -90 and 90'),
  body('pickup.longitude').isFloat({ min: -180, max: 180 }).withMessage('Pickup longitude must be between -180 and 180'),
  body('pickup.address').isString().withMessage('Pickup address is required'),
  body('destination').isObject().withMessage('Destination must be an object'),
  body('destination.latitude').isFloat({ min: -90, max: 90 }).withMessage('Destination latitude must be between -90 and 90'),
  body('destination.longitude').isFloat({ min: -180, max: 180 }).withMessage('Destination longitude must be between -180 and 180'),
  body('destination.address').isString().withMessage('Destination address is required'),
  body('passengers').optional().isInt({ min: 1, max: 20 }).withMessage('Passengers must be between 1 and 20'),
  body('date').optional().isISO8601().withMessage('Date must be a valid date'),
  body('time').optional().isISO8601().withMessage('Time must be a valid time')
], validate, estimateFare);

// Driver-only routes (require authentication)
router.put('/:id/location', [
  protectDriver,
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('address').optional().isString().withMessage('Address must be a string')
], validate, updateVehicleLocation);

router.put('/:id/availability', [
  protectDriver,
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], validate, updateVehicleAvailability);

router.get('/:id/maintenance', [
  protectDriver,
  param('id').isMongoId().withMessage('Invalid vehicle ID')
], validate, getVehicleMaintenance);

router.post('/:id/maintenance', [
  protectDriver,
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  body('type').isIn(['service', 'repair', 'inspection', 'cleaning', 'other']).withMessage('Invalid maintenance type'),
  body('description').isString().withMessage('Description is required'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('date').isISO8601().withMessage('Date must be a valid date'),
  body('nextServiceDate').optional().isISO8601().withMessage('Next service date must be a valid date'),
  body('serviceCenter').optional().isString().withMessage('Service center must be a string')
], validate, addMaintenanceRecord);






module.exports = router;
