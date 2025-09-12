const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import Driver model
const Driver = require('../models/Driver');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI_PROD || 'mongodb://localhost:27017/chalo_sawari',
      {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      }
    );

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const setupTestDriver = async () => {
  try {
    console.log('🚀 Starting test driver setup for 1234567890...');
    
    // Connect to database
    await connectDB();
    
    const testPhone = '1234567890';
    const defaultOTP = '123456';
    
    // Check if test driver already exists
    const existingDriver = await Driver.findOne({ phone: testPhone });
    
    if (existingDriver) {
      console.log('🚗 Test driver already exists, updating...');
      
      // Update existing driver to be test driver
      existingDriver.isTestUser = true;
      existingDriver.defaultOTP = defaultOTP;
      existingDriver.isVerified = true;
      existingDriver.isApproved = true;
      existingDriver.isActive = true;
      existingDriver.firstName = 'Test';
      existingDriver.lastName = 'Driver2';
      existingDriver.email = 'driver2@test.com';
      
      await existingDriver.save();
      console.log('✅ Test driver updated successfully!');
    } else {
      console.log('👤 Creating new test driver...');
      
      // Create new test driver
      const testDriver = new Driver({
        firstName: 'Test',
        lastName: 'Driver2',
        email: 'driver2@test.com',
        phone: testPhone,
        password: 'testpassword123', // Will be hashed by pre-save middleware
        gender: 'male',
        dateOfBirth: new Date('1990-01-01'),
        isActive: true,
        isVerified: true,
        isApproved: true,
        isTestUser: true,
        defaultOTP: defaultOTP,
        address: {
          street: 'Test Street 2',
          city: 'Test City 2',
          state: 'Test State 2',
          pincode: '123456',
          country: 'India'
        },
        documents: {
          drivingLicense: { 
            number: 'TEST123456', 
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isVerified: true
          },
          vehicleRC: { 
            number: 'TEST789012', 
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isVerified: true
          }
        },
        vehicleDetails: {
          type: 'car',
          brand: 'Test Brand 2',
          model: 'Test Model 2',
          year: new Date().getFullYear(),
          color: 'White',
          fuelType: 'petrol',
          seatingCapacity: 4,
          isAvailable: true
        },
        bankDetails: {
          accountNumber: 'TEST123456789',
          ifscCode: 'TEST0001234',
          bankName: 'Test Bank 2',
          accountHolderName: 'Test Driver 2'
        },
        earnings: {
          wallet: {
            balance: 0,
            transactions: []
          },
          commission: 10
        }
      });
      
      await testDriver.save();
      console.log('✅ Test driver created successfully!');
    }
    
    // Verify the setup
    const verifyDriver = await Driver.findOne({ phone: testPhone });
    console.log('\n📋 Test Driver Details:');
    console.log(`   Phone: ${verifyDriver.phone}`);
    console.log(`   Name: ${verifyDriver.firstName} ${verifyDriver.lastName}`);
    console.log(`   Email: ${verifyDriver.email}`);
    console.log(`   Is Test User: ${verifyDriver.isTestUser}`);
    console.log(`   Default OTP: ${verifyDriver.defaultOTP}`);
    console.log(`   Is Verified: ${verifyDriver.isVerified}`);
    console.log(`   Is Approved: ${verifyDriver.isApproved}`);
    console.log(`   Is Active: ${verifyDriver.isActive}`);
    
    console.log('\n🎉 Test driver setup completed successfully!');
    console.log('📝 You can now login with:');
    console.log(`   Phone: ${testPhone}`);
    console.log(`   OTP: ${defaultOTP}`);
    
  } catch (error) {
    console.error('❌ Error setting up test driver:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the setup
setupTestDriver();
