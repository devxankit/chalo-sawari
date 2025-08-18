const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret';

// Protect routes - require authentication
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized to access this route',
        statusCode: 401
      }
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found',
          statusCode: 401
        }
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Account is deactivated',
          statusCode: 401
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized to access this route',
        statusCode: 401
      }
    });
  }
};

// Protect driver routes
const protectDriver = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.driverToken) {
    token = req.cookies.driverToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized to access driver routes',
        statusCode: 401
      }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const driver = await Driver.findById(decoded.id).select('-password');
    
    if (!driver) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Driver not found',
          statusCode: 401
        }
      });
    }

    if (!driver.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Driver account is deactivated',
          statusCode: 401
        }
      });
    }

    if (!driver.isVerified) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Driver account not verified',
          statusCode: 401
        }
      });
    }

    req.driver = driver;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized to access driver routes',
        statusCode: 401
      }
    });
  }
};

// Protect admin routes
const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.adminToken) {
    token = req.cookies.adminToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized to access admin routes',
        statusCode: 401
      }
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Admin not found',
          statusCode: 401
        }
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Admin account is deactivated',
          statusCode: 401
        }
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized to access admin routes',
        statusCode: 401
      }
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user && !req.driver && !req.admin) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized to access this route',
          statusCode: 401
        }
      });
    }

    let userRole = 'user';
    if (req.driver) userRole = 'driver';
    if (req.admin) userRole = 'admin';

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `User role ${userRole} is not authorized to access this route`,
          statusCode: 403
        }
      });
    }

    next();
  };
};

module.exports = {
  protect,
  protectDriver,
  protectAdmin,
  authorize
};
