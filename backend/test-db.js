const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chalo-sawari')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import Vehicle model
const Vehicle = require('./models/Vehicle');

async function testDatabase() {
  try {
    console.log('\n🔍 Testing database for autos...');
    
    // Check total autos
    const totalAutos = await Vehicle.countDocuments({ type: 'auto' });
    console.log(`📊 Total autos in database: ${totalAutos}`);
    
    if (totalAutos === 0) {
      console.log('🚨 No autos found in database!');
      return;
    }
    
    // Get all autos with basic info
    const allAutos = await Vehicle.find({ type: 'auto' })
      .select('brand model approvalStatus isActive isAvailable bookingStatus booked driver')
      .populate('driver', 'firstName lastName isActive');
    
    console.log('\n📋 All autos details:');
    allAutos.forEach((auto, index) => {
      console.log(`${index + 1}. ${auto.brand} ${auto.model} (${auto._id})`);
      console.log(`   - Approval Status: ${auto.approvalStatus}`);
      console.log(`   - Is Active: ${auto.isActive}`);
      console.log(`   - Is Available: ${auto.isAvailable}`);
      console.log(`   - Booking Status: ${auto.bookingStatus || 'undefined'}`);
      console.log(`   - Booked: ${auto.booked}`);
      console.log(`   - Has Driver: ${!!auto.driver}`);
      if (auto.driver) {
        console.log(`   - Driver: ${auto.driver.firstName} ${auto.driver.lastName} (Active: ${auto.driver.isActive})`);
      }
      console.log('');
    });
    
    // Check filtered results
    console.log('\n🔍 Checking filters...');
    
    const approvedAutos = allAutos.filter(auto => auto.approvalStatus === 'approved');
    console.log(`✅ Approved autos: ${approvedAutos.length}`);
    
    const activeAutos = approvedAutos.filter(auto => auto.isActive);
    console.log(`✅ Active autos: ${activeAutos.length}`);
    
    const availableAutos = activeAutos.filter(auto => auto.isAvailable);
    console.log(`✅ Available autos: ${availableAutos.length}`);
    
    const autosWithDrivers = activeAutos.filter(auto => auto.driver);
    console.log(`✅ Autos with drivers: ${autosWithDrivers.length}`);
    
    console.log('\n🎯 Final result - what the API should return:');
    console.log(`Total autos that should be visible: ${autosWithDrivers.length}`);
    
  } catch (error) {
    console.error('❌ Error testing database:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testDatabase();
