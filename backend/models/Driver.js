const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoosePaginate = require('mongoose-paginate-v2');

const DriverSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^[0-9]{10}$/, 'Please add a valid 10-digit phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  profilePicture: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required']
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  documents: {
    drivingLicense: {
      number: {
        type: String,
        required: [true, 'Driving license number is required']
      },
      expiryDate: {
        type: Date,
        required: [true, 'Driving license expiry date is required']
      },
      image: String,
      isVerified: {
        type: Boolean,
        default: false
      }
    },
    vehicleRC: {
      number: {
        type: String,
        required: [true, 'Vehicle RC number is required']
      },
      expiryDate: {
        type: Date,
        required: [true, 'Vehicle RC expiry date is required']
      },
      image: String,
      isVerified: {
        type: Boolean,
        default: false
      }
    },
    insurance: {
      number: String,
      expiryDate: Date,
      image: String,
      isVerified: {
        type: Boolean,
        default: false
      }
    },
    fitness: {
      number: String,
      expiryDate: Date,
      image: String,
      isVerified: {
        type: Boolean,
        default: false
      }
    },
    permit: {
      number: String,
      expiryDate: Date,
      image: String,
      isVerified: {
        type: Boolean,
        default: false
      }
    }
  },
  vehicleDetails: {
    type: {
      type: String,
      enum: ['bus', 'car', 'auto'],
      required: [true, 'Vehicle type is required']
    },
    brand: {
      type: String,
      required: [true, 'Vehicle brand is required']
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required']
    },
    year: {
      type: Number,
      required: [true, 'Vehicle year is required']
    },
    color: {
      type: String,
      required: [true, 'Vehicle color is required']
    },
    fuelType: {
      type: String,
      enum: ['petrol', 'diesel', 'cng', 'electric', 'hybrid'],
      required: [true, 'Fuel type is required']
    },
    transmission: {
      type: String,
      enum: ['manual', 'automatic'],
      default: 'manual'
    },
    seatingCapacity: {
      type: Number,
      required: [true, 'Seating capacity is required']
    },
    images: [String],
    isAc: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: [true, 'Bank account number is required']
    },
    ifscCode: {
      type: String,
      required: [true, 'IFSC code is required']
    },
    bankName: {
      type: String,
      required: [true, 'Bank name is required']
    },
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    code: String,
    expiresAt: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  totalRides: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  availability: {
    isOnline: {
      type: Boolean,
      default: false
    },
    lastStatusChange: {
      type: Date,
      default: Date.now
    },
    workingHours: {
      start: {
        type: String,
        default: '06:00'
      },
      end: {
        type: String,
        default: '22:00'
      }
    },
    workingDays: {
      type: [String],
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }
  },
  earnings: {
    wallet: {
      balance: {
        type: Number,
        default: 0
      },
      transactions: [{
        type: {
          type: String,
          enum: ['credit', 'debit'],
          required: true
        },
        amount: {
          type: Number,
          required: true
        },
        description: String,
        date: {
          type: Date,
          default: Date.now
        }
      }]
    },
    commission: {
      type: Number,
      default: 15, // 15% commission
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
DriverSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
DriverSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for experience
DriverSchema.virtual('experience').get(function() {
  const today = new Date();
  const licenseDate = new Date(this.documents.drivingLicense.expiryDate);
  const years = Math.floor((today - licenseDate) / (1000 * 60 * 60 * 24 * 365));
  return Math.max(0, years);
});

// Index for better query performance
// DriverSchema.index({ email: 1, phone: 1 }); // Remove this line since email and phone are already unique
DriverSchema.index({ isActive: 1, isVerified: 1, isApproved: 1 });
DriverSchema.index({ 'currentLocation.coordinates': '2dsphere' });
DriverSchema.index({ 'vehicleDetails.type': 1, 'vehicleDetails.isAvailable': 1 });

// Encrypt password using bcrypt
DriverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
DriverSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Match driver entered password to hashed password in database
DriverSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is locked
DriverSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
DriverSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
DriverSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Generate verification code
DriverSchema.methods.generateVerificationCode = function() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  
  this.verificationCode = { code, expiresAt };
  return this.save();
};

// Verify code
DriverSchema.methods.verifyCode = function(code) {
  if (!this.verificationCode || !this.verificationCode.code) {
    return false;
  }
  
  if (this.verificationCode.expiresAt < new Date()) {
    return false;
  }
  
  return this.verificationCode.code === code;
};

// Update current location
DriverSchema.methods.updateLocation = function(latitude, longitude, address) {
  this.currentLocation.coordinates = [longitude, latitude];
  this.currentLocation.address = address;
  this.currentLocation.lastUpdated = new Date();
  return this.save();
};

// Add earnings
DriverSchema.methods.addEarnings = function(amount, description) {
  this.totalEarnings += amount;
  this.earnings.wallet.balance += amount;
  this.earnings.wallet.transactions.push({
    type: 'credit',
    amount,
    description,
    date: new Date()
  });
  return this.save();
};

// Deduct from wallet
DriverSchema.methods.deductFromWallet = function(amount, description) {
  if (this.earnings.wallet.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  
  this.earnings.wallet.balance -= amount;
  this.earnings.wallet.transactions.push({
    type: 'debit',
    amount,
    description,
    date: new Date()
  });
  return this.save();
};

// Toggle online status
DriverSchema.methods.toggleOnlineStatus = function() {
  this.availability.isOnline = !this.availability.isOnline;
  return this.save();
};

// Add pagination plugin
DriverSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Driver', DriverSchema);
