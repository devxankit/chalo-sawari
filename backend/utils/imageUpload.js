const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chalo-sawari/vehicles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' }, // Resize images
      { quality: 'auto:good' } // Optimize quality
    ]
  }
});

// Configure Cloudinary storage for Offers
const offerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chalo-sawari/offers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' }, // Resize images
      { quality: 'auto:good' } // Optimize quality
    ]
  }
});

// Configure Multer for image uploads
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware for single image upload
const uploadSingle = upload.single('image');

// Middleware for multiple image uploads
const uploadMultiple = upload.array('images', 10);

// Middleware for offer image upload
const uploadOfferImage = multer({
  storage: offerStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter called with:', { 
      originalname: file.originalname, 
      mimetype: file.mimetype,
      size: file.size 
    });
    
    // Check file type
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    console.log('File validation:', { extname, mimetype, allowed: mimetype && extname });

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
}).single('image');

// Add error handling wrapper for uploadOfferImage
const uploadOfferImageWithErrorHandling = (req, res, next) => {
  uploadOfferImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.log('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      console.log('Other upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    next();
  });
};

// Function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Function to get image URL from Cloudinary response
const getImageUrl = (file) => {
  if (file.path) {
    return file.path; // Cloudinary URL
  }
  return null;
};

// Function to optimize image before upload
const optimizeImage = async (imageBuffer, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload_stream(
      {
        folder: 'chalo-sawari/vehicles',
        transformation: [
          { width: options.width || 800, height: options.height || 600, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Error optimizing image:', error);
        }
      }
    ).end(imageBuffer);
    
    return result;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
};

// Function to generate thumbnail
const generateThumbnail = async (imageUrl, width = 200, height = 200) => {
  try {
    const publicId = imageUrl.split('/').pop().split('.')[0];
    const thumbnailUrl = cloudinary.url(publicId, {
      transformation: [
        { width, height, crop: 'fill' },
        { quality: 'auto:good' }
      ]
    });
    return thumbnailUrl;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return imageUrl; // Return original URL if thumbnail generation fails
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadOfferImage,
  uploadOfferImageWithErrorHandling,
  deleteImage,
  getImageUrl,
  optimizeImage,
  generateThumbnail,
  cloudinary
};
