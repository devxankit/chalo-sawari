const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('=== VALIDATION FAILED ===');
    console.log('Request body:', req.body);
    console.log('Validation errors:', errors.array());
    
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        details: errorMessages
      }
    });
  }

  next();
};

module.exports = { validate };
