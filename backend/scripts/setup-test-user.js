const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('../models/User');

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

const setupTestUser = async () => {
  try {
    console.log('🚀 Starting test user setup...');
    
    // Connect to database
    await connectDB();
    
    const testPhone = '9589579906';
    const defaultOTP = '139913';
    
    // Check if test user already exists
    const existingUser = await User.findOne({ phone: testPhone });
    
    if (existingUser) {
      console.log('📱 Test user already exists, updating...');
      
      // Update existing user to be test user
      existingUser.isTestUser = true;
      existingUser.defaultOTP = defaultOTP;
      existingUser.isVerified = true;
      existingUser.isActive = true;
      existingUser.firstName = 'Test';
      existingUser.lastName = 'User';
      existingUser.email = 'test@test.com';
      
      await existingUser.save();
      console.log('✅ Test user updated successfully!');
    } else {
      console.log('👤 Creating new test user...');
      
      // Create new test user
      const testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com',
        phone: testPhone,
        password: 'testpassword123', // Will be hashed by pre-save middleware
        gender: 'prefer-not-to-say',
        isActive: true,
        isVerified: true,
        isTestUser: true,
        defaultOTP: defaultOTP,
        address: {
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India'
        }
      });
      
      await testUser.save();
      console.log('✅ Test user created successfully!');
    }
    
    // Verify the setup
    const verifyUser = await User.findOne({ phone: testPhone });
    console.log('\n📋 Test User Details:');
    console.log(`   Phone: ${verifyUser.phone}`);
    console.log(`   Name: ${verifyUser.firstName} ${verifyUser.lastName}`);
    console.log(`   Email: ${verifyUser.email}`);
    console.log(`   Is Test User: ${verifyUser.isTestUser}`);
    console.log(`   Default OTP: ${verifyUser.defaultOTP}`);
    console.log(`   Is Verified: ${verifyUser.isVerified}`);
    console.log(`   Is Active: ${verifyUser.isActive}`);
    
    console.log('\n🎉 Test user setup completed successfully!');
    console.log('📝 You can now login with:');
    console.log(`   Phone: ${testPhone}`);
    console.log(`   OTP: ${defaultOTP}`);
    
  } catch (error) {
    console.error('❌ Error setting up test user:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the setup
setupTestUser();
