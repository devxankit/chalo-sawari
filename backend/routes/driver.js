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
  requestWithdrawal,
  getDriverVehicles,
  createVehicle,
  updateVehicleById,
  deleteVehicle,
  completeTrip,
  cancelTrip,
  getActiveTrips,
  getTripHistory,
  getTodayEarnings,
  acceptDriverAgreement,
  uploadDocument
} = require('../controllers/driverController');
const { protectDriver } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadMultiple } = require('../utils/imageUpload');
const { uploadDocumentWithErrorHandling } = require('../utils/driverDocumentUpload');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protectDriver);

// Debug endpoint to test driver authentication
router.get('/debug', (req, res) => {
  res.json({
    success: true,
    message: 'Driver authentication working',
    driver: {
      id: req.driver.id,
      name: req.driver.firstName + ' ' + req.driver.lastName,
      phone: req.driver.phone
    }
  });
});

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

// Agreement route
router.post('/accept-agreement', [
  body('agreements').isObject().withMessage('Agreements must be an object'),
  body('agreements.rcValid').isBoolean().withMessage('RC valid must be a boolean'),
  body('agreements.insuranceValid').isBoolean().withMessage('Insurance valid must be a boolean'),
  body('agreements.roadTaxValid').isBoolean().withMessage('Road tax valid must be a boolean'),
  body('agreements.drivingLicenseValid').isBoolean().withMessage('Driving license valid must be a boolean'),
  body('agreements.legalResponsibility').isBoolean().withMessage('Legal responsibility must be a boolean'),
  body('agreements.platformLiability').isBoolean().withMessage('Platform liability must be a boolean'),
  body('agreements.serviceResponsibility').isBoolean().withMessage('Service responsibility must be a boolean'),
  body('ipAddress').optional().isString().withMessage('IP address must be a string')
], validate, acceptDriverAgreement);

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

router.get('/earnings/today', getTodayEarnings);

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

// Trip management routes
router.put('/bookings/:id/complete', [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('actualDistance').optional().isFloat({ min: 0 }).withMessage('Actual distance must be a positive number'),
  body('actualDuration').optional().isFloat({ min: 0 }).withMessage('Actual duration must be a positive number'),
  body('actualFare').optional().isFloat({ min: 0 }).withMessage('Actual fare must be a positive number'),
  body('driverNotes').optional().isString().withMessage('Driver notes must be a string')
], validate, completeTrip);

router.put('/bookings/:id/cancel', [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], validate, cancelTrip);

router.get('/trips/active', getActiveTrips);

router.get('/trips/history', [
  query('status').optional().isIn(['pending', 'accepted', 'started', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], validate, getTripHistory);

// Vehicle routes
router.get('/vehicles', getDriverVehicles);
router.get('/vehicle', getDriverVehicle);
router.post('/vehicles', [
  body('type').isIn(['bus', 'car', 'auto']).withMessage('Invalid vehicle type'),
  body('brand').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Brand must be between 1 and 50 characters'),
  body('fuelType').isIn(['petrol', 'diesel', 'cng', 'electric', 'hybrid']).withMessage('Invalid fuel type'),
  body('seatingCapacity').isInt({ min: 1, max: 100 }).withMessage('Seating capacity must be between 1 and 100'),
  body('isAc').optional().isBoolean().withMessage('isAc must be a boolean'),
  body('isSleeper').optional().isBoolean().withMessage('isSleeper must be a boolean'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('registrationNumber').isString().trim().isLength({ min: 5, max: 20 }).withMessage('Registration number must be between 5 and 20 characters'),
  body('insuranceNumber').optional().isString().trim().withMessage('Insurance number must be a string'),
  body('insuranceExpiryDate').optional().isISO8601().withMessage('Insurance expiry date must be a valid date'),
  body('fitnessNumber').optional().isString().trim().withMessage('Fitness number must be a string'),
  body('fitnessExpiryDate').optional().isISO8601().withMessage('Fitness expiry date must be a valid date'),
  body('permitNumber').optional().isString().trim().withMessage('Permit number must be a string'),
  body('permitExpiryDate').optional().isISO8601().withMessage('Permit expiry date must be a valid date'),
  body('pucNumber').optional().isString().trim().withMessage('PUC number must be a string'),
  body('pucExpiryDate').optional().isISO8601().withMessage('PUC expiry date must be a valid date'),
  body('pricingReference.category').isIn(['auto', 'car', 'bus']).withMessage('Invalid vehicle category'),
  body('pricingReference.vehicleType').notEmpty().withMessage('Vehicle type is required'),
  body('pricingReference.vehicleModel').notEmpty().withMessage('Vehicle model is required'),
  body('workingDays').optional().isArray().withMessage('Working days must be an array'),
  body('workingHoursStart').optional().isString().withMessage('Working hours start must be a string'),
  body('workingHoursEnd').optional().isString().withMessage('Working hours end must be a string'),
  body('operatingCities').optional().isArray().withMessage('Operating cities must be an array'),
  body('operatingStates').optional().isArray().withMessage('Operating states must be an array'),
  body('vehicleLocation.latitude').isFloat({ min: -90, max: 90 }).withMessage('Vehicle location latitude must be between -90 and 90'),
  body('vehicleLocation.longitude').isFloat({ min: -180, max: 180 }).withMessage('Vehicle location longitude must be between -180 and 180'),
  body('vehicleLocation.address').isString().withMessage('Vehicle location address is required'),
  body('vehicleLocation.city').optional().isString().withMessage('Vehicle location city must be a string'),
  body('vehicleLocation.state').optional().isString().withMessage('Vehicle location state must be a string')
], validate, createVehicle);

router.put('/vehicles/:id', [
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  body('type').optional().isIn(['bus', 'car', 'auto']).withMessage('Invalid vehicle type'),
  body('brand').optional().isString().trim().isLength({ min: 1, max: 50 }).withMessage('Brand must be between 1 and 50 characters'),
  body('fuelType').optional().isIn(['petrol', 'diesel', 'cng', 'electric', 'hybrid']).withMessage('Invalid fuel type'),
  body('seatingCapacity').optional().isInt({ min: 1, max: 100 }).withMessage('Seating capacity must be between 1 and 100'),
  body('isAc').optional().isBoolean().withMessage('isAc must be a boolean'),
  body('isSleeper').optional().isBoolean().withMessage('isSleeper must be a boolean'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('registrationNumber').optional().isString().trim().isLength({ min: 5, max: 20 }).withMessage('Registration number must be between 5 and 20 characters'),
  body('insuranceNumber').optional().isString().trim().withMessage('Insurance number must be a string'),
  body('insuranceExpiryDate').optional().isISO8601().withMessage('Insurance expiry date must be a valid date'),
  body('fitnessNumber').optional().isString().trim().withMessage('Fitness number must be a string'),
  body('fitnessExpiryDate').optional().isISO8601().withMessage('Fitness expiry date must be a valid date'),
  body('permitNumber').optional().isString().trim().withMessage('Permit number must be a string'),
  body('permitExpiryDate').optional().isISO8601().withMessage('Permit expiry date must be a valid date'),
  body('pucNumber').optional().isString().trim().withMessage('PUC number must be a string'),
  body('pucExpiryDate').optional().isISO8601().withMessage('PUC expiry date must be a valid date'),
  body('rcNumber').optional().isString().trim().withMessage('RC number must be a string'),
  body('rcExpiryDate').optional().isISO8601().withMessage('RC expiry date must be a valid date'),
  body('pricingReference.category').optional().isIn(['auto', 'car', 'bus']).withMessage('Invalid vehicle category'),
  body('pricingReference.vehicleType').optional().notEmpty().withMessage('Vehicle type is required'),
  body('pricingReference.vehicleModel').optional().notEmpty().withMessage('Vehicle model is required'),
  body('workingDays').optional().isArray().withMessage('Working days must be an array'),
  body('workingHoursStart').optional().isString().withMessage('Working hours start must be a string'),
  body('workingHoursEnd').optional().isString().withMessage('Working hours end must be a string'),
  body('operatingCities').optional().isArray().withMessage('Operating cities must be an array'),
  body('operatingStates').optional().isArray().withMessage('Operating states must be an array'),
  body('vehicleLocation.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Vehicle location latitude must be between -90 and 90'),
  body('vehicleLocation.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Vehicle location longitude must be between -180 and 180'),
  body('vehicleLocation.address').optional().isString().withMessage('Vehicle location address must be a string'),
  body('vehicleLocation.city').optional().isString().withMessage('Vehicle location city must be a string'),
  body('vehicleLocation.state').optional().isString().withMessage('Vehicle location state must be a string')
], validate, updateVehicleById);

router.delete('/vehicles/:id', [
  param('id').isMongoId().withMessage('Invalid vehicle ID')
], validate, deleteVehicle);

// Vehicle image routes
router.post('/vehicles/:id/images', [
  param('id').isMongoId().withMessage('Invalid vehicle ID')
], uploadMultiple, async (req, res) => {
  try {
    const Vehicle = require('../models/Vehicle');
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if the current driver owns this vehicle
    if (vehicle.driver.toString() !== req.driver.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vehicle'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    // Process uploaded images
    const imageUrls = req.files.map((file, index) => {
      const url = file.path || (file.secure_url ? file.secure_url : null);
      const caption = file.originalname || `Vehicle image ${index + 1}`;
      return {
        url,
        caption,
        isPrimary: false,
      };
    }).filter(img => !!img.url);

    // Add new images to existing ones
    vehicle.images = [...vehicle.images, ...imageUrls];

    // Ensure only one primary image
    if (vehicle.images.length > 0) {
      const hasPrimary = vehicle.images.some(i => i.isPrimary);
      if (!hasPrimary) {
        vehicle.images[0].isPrimary = true;
      }
    }

    await vehicle.save();

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        images: vehicle.images,
        totalImages: vehicle.images.length
      }
    });
  } catch (error) {
    console.error('Error uploading vehicle images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
});

router.delete('/vehicles/:id/images/:imageId', [
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  param('imageId').isMongoId().withMessage('Invalid image ID')
], validate, async (req, res) => {
  try {
    const Vehicle = require('../models/Vehicle');
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if the current driver owns this vehicle
    if (vehicle.driver.toString() !== req.driver.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vehicle'
      });
    }

    const imageIndex = vehicle.images.findIndex(
      img => img._id.toString() === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Don't allow removing the last image
    if (vehicle.images.length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the last image'
      });
    }

    // Remove the image
    vehicle.images.splice(imageIndex, 1);

    // If the removed image was primary, make the first image primary
    if (vehicle.images.length > 0) {
      const hasPrimary = vehicle.images.some(i => i.isPrimary);
      if (!hasPrimary) {
        vehicle.images[0].isPrimary = true;
      }
    }

    await vehicle.save();

    res.json({
      success: true,
      message: 'Image removed successfully',
      data: {
        images: vehicle.images,
        totalImages: vehicle.images.length
      }
    });
  } catch (error) {
    console.error('Error removing vehicle image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove image',
      error: error.message
    });
  }
});

router.put('/vehicle', [
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

// Document upload route
router.post('/upload-document', uploadDocumentWithErrorHandling, uploadDocument);

// Wallet and withdrawal routes
router.post('/withdraw', [
  body('amount').isFloat({ min: 100 }).withMessage('Minimum withdrawal amount is ₹100'),
  body('bankDetails.accountNumber').isString().withMessage('Account number is required'),
  body('bankDetails.ifscCode').isString().withMessage('IFSC code is required'),
  body('bankDetails.accountHolderName').isString().withMessage('Account holder name is required'),
  body('bankDetails.bankName').isString().withMessage('Bank name is required')
], validate, requestWithdrawal);

// Update vehicle base location
router.put('/vehicles/:id/base-location', [
  param('id').isMongoId().withMessage('Invalid vehicle ID'),
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('address').isString().withMessage('Address is required'),
  body('city').optional().isString().withMessage('City must be a string'),
  body('state').optional().isString().withMessage('State must be a string')
], validate, async (req, res) => {
  try {
    const Vehicle = require('../models/Vehicle');
    const { id } = req.params;
    const { latitude, longitude, address, city, state } = req.body;

    // Find vehicle and ensure driver owns it
    const vehicle = await Vehicle.findOne({
      _id: id,
      driver: req.driver.id
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or you do not have permission to update it'
      });
    }

    // Update vehicle location using the model method
    await vehicle.updateVehicleLocation(latitude, longitude, address, city, state);

    res.json({
      success: true,
      message: 'Vehicle base location updated successfully',
      data: {
        vehicleLocation: vehicle.vehicleLocation
      }
    });
  } catch (error) {
    console.error('Error updating vehicle base location:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle location'
    });
  }
});

module.exports = router;
