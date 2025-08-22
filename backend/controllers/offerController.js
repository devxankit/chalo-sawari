const asyncHandler = require('../middleware/asyncHandler');
const Offer = require('../models/Offer');
const { deleteImage } = require('../utils/imageUpload');

// @desc    Get all active offers
// @route   GET /api/offers
// @access  Public
const getActiveOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find({ isActive: true })
    .sort({ createdAt: -1 })
    .select('title image');

  res.json({
    success: true,
    count: offers.length,
    data: offers
  });
});

// @desc    Get all offers (admin only)
// @route   GET /api/admin/offers
// @access  Private (Admin)
const getAllOffers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', status = '' } = req.query;

  // Build query
  let query = {};
  
  if (search) {
    query.title = { $regex: search, $options: 'i' };
  }
  
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const offers = await Offer.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Offer.countDocuments(query);

  res.json({
    success: true,
    data: offers,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    }
  });
});

// @desc    Get offer by ID
// @route   GET /api/admin/offers/:id
// @access  Private (Admin)
const getOfferById = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found'
    });
  }

  res.json({
    success: true,
    data: offer
  });
});

// @desc    Create new offer
// @route   POST /api/admin/offers
// @access  Private (Admin)
const createOffer = asyncHandler(async (req, res) => {
  console.log('createOffer called with:', { body: req.body, file: req.file, headers: req.headers });
  
  const { title } = req.body;
  
  if (!req.file) {
    console.log('No file uploaded. req.file:', req.file);
    return res.status(400).json({
      success: false,
      message: 'Offer image is required'
    });
  }

  console.log('File uploaded successfully:', req.file);

  const offer = await Offer.create({
    title,
    image: req.file.path
  });

  res.status(201).json({
    success: true,
    message: 'Offer created successfully',
    data: offer
  });
});

// @desc    Update offer
// @route   PUT /api/admin/offers/:id
// @access  Private (Admin)
const updateOffer = asyncHandler(async (req, res) => {
  const { title } = req.body;
  
  let updateData = { title };
  
  // If new image is uploaded, update image and delete old one
  if (req.file) {
    const offer = await Offer.findById(req.params.id);
    if (offer && offer.image) {
      // Extract public_id from Cloudinary URL for deletion
      const publicId = offer.image.split('/').pop().split('.')[0];
      try {
        await deleteImage(publicId);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }
    updateData.image = req.file.path;
  }

  const updatedOffer = await Offer.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  if (!updatedOffer) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found'
    });
  }

  res.json({
    success: true,
    message: 'Offer updated successfully',
    data: updatedOffer
  });
});

// @desc    Delete offer
// @route   DELETE /api/admin/offers/:id
// @access  Private (Admin)
const deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found'
    });
  }

  // Delete image from Cloudinary
  if (offer.image) {
    try {
      const publicId = offer.image.split('/').pop().split('.')[0];
      await deleteImage(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  }

  await Offer.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Offer deleted successfully'
  });
});

// @desc    Toggle offer status
// @route   PATCH /api/admin/offers/:id/status
// @access  Private (Admin)
const toggleOfferStatus = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);

  if (!offer) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found'
    });
  }

  offer.isActive = !offer.isActive;
  await offer.save();

  res.json({
    success: true,
    message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
    data: offer
  });
});

// @desc    Get offer statistics
// @route   GET /api/admin/offers/stats
// @access  Private (Admin)
const getOfferStats = asyncHandler(async (req, res) => {
  const totalOffers = await Offer.countDocuments();
  const activeOffers = await Offer.countDocuments({ isActive: true });
  const inactiveOffers = await Offer.countDocuments({ isActive: false });

  res.json({
    success: true,
    data: {
      totalOffers,
      activeOffers,
      inactiveOffers
    }
  });
});

module.exports = {
  getActiveOffers,
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
  getOfferStats
};
