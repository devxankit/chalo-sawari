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

const setupApprovedDriver = async () => {
  try {
    console.log('🚀 Setting up approved driver for testing...');
    
    // Connect to database
    await connectDB();
    
    const testPhone = '8888888888';
    
    // Check if driver already exists
    const existingDriver = await Driver.findOne({ phone: testPhone });
    
    if (existingDriver) {
      console.log('🚗 Driver already exists, updating...');
      
      // Update existing driver to be approved
      existingDriver.isVerified = true;
      existingDriver.isApproved = true;
      existingDriver.isActive = true;
      existingDriver.firstName = 'Approved';
      existingDriver.lastName = 'Driver';
      existingDriver.email = 'approved@test.com';
      
      await existingDriver.save();
      console.log('✅ Driver updated and approved successfully!');
    } else {
      console.log('👤 Creating new approved driver...');
      
      // Create new approved driver
      const approvedDriver = new Driver({
        firstName: 'Approved',
        lastName: 'Driver',
        email: 'approved@test.com',
        phone: testPhone,
        password: 'testpassword123', // Will be hashed by pre-save middleware
        gender: 'male',
        dateOfBirth: new Date('1990-01-01'),
        isActive: true,
        isVerified: true,
        isApproved: true, // This is the key - immediately approved
        address: {
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India'
        },
        documents: {
          drivingLicense: { 
            number: 'APPROVED123', 
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isVerified: true
          },
          vehicleRC: { 
            number: 'APPROVED456', 
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isVerified: true
          }
        },
        vehicleDetails: {
          type: 'car',
          brand: 'Test Brand',
          model: 'Test Model',
          year: new Date().getFullYear(),
          color: 'White',
          fuelType: 'petrol',
          seatingCapacity: 4,
          isAvailable: true
        },
        bankDetails: {
          accountNumber: 'APPROVED123456',
          ifscCode: 'APPROVED1234',
          bankName: 'Test Bank',
          accountHolderName: 'Approved Driver'
        },
        earnings: {
          wallet: {
            balance: 0,
            transactions: []
          },
          commission: 10
        }
      });
      
      await approvedDriver.save();
      console.log('✅ Approved driver created successfully!');
    }
    
    // Verify the setup
    const verifyDriver = await Driver.findOne({ phone: testPhone });
    console.log('\n📋 Approved Driver Details:');
    console.log(`   Phone: ${verifyDriver.phone}`);
    console.log(`   Name: ${verifyDriver.firstName} ${verifyDriver.lastName}`);
    console.log(`   Email: ${verifyDriver.email}`);
    console.log(`   Is Verified: ${verifyDriver.isVerified}`);
    console.log(`   Is Approved: ${verifyDriver.isApproved}`);
    console.log(`   Is Active: ${verifyDriver.isActive}`);
    
    console.log('\n🎉 Approved driver setup completed successfully!');
    console.log('📝 You can now test login with:');
    console.log(`   Phone: ${testPhone}`);
    console.log(`   OTP: (will be generated dynamically)`);
    
  } catch (error) {
    console.error('❌ Error setting up approved driver:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the setup
setupApprovedDriver();
