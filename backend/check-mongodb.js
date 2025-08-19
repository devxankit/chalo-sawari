#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Checking MongoDB Connection Status...\n');

const checkMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI || 'mongodb://localhost:27017/chalo_sawari';
    console.log('📍 Connection String:', mongoURI);
    console.log('🔌 Attempting to connect...');
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB Connection Successful!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔌 Connection State: ${mongoose.connection.readyState}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`🔢 Port: ${mongoose.connection.port}`);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📚 Collections found: ${collections.length}`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
  } catch (error) {
    console.error('❌ MongoDB Connection Failed!');
    console.error('Error:', error.message);
    
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Check if MongoDB service is running:');
    console.log('   Windows: net start MongoDB');
    console.log('   macOS/Linux: sudo systemctl start mongod');
    
    console.log('\n2. Verify MongoDB is listening on port 27017:');
    console.log('   netstat -an | findstr 27017');
    
    console.log('\n3. Check your .env file contains:');
    console.log('   MONGODB_URI_PROD=mongodb://127.0.0.1:27017/chalo_sawari');
    console.log('   or');
    console.log('   MONGODB_URI=mongodb://127.0.0.1:27017/chalo_sawari');
    
    console.log('\n4. Try using 127.0.0.1 instead of localhost:');
    console.log('   MONGODB_URI_PROD=mongodb://127.0.0.1:27017/chalo_sawari');
    
    console.log('\n5. If using MongoDB Atlas, ensure your IP is whitelisted');
    
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔌 Connection closed');
    }
    process.exit(0);
  }
};

checkMongoDB();
