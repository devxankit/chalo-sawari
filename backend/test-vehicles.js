const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chalosawari', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testVehicles() {
  try {
    console.log('🔍 Testing Vehicle Database...');
    
    // Test 1: Check all vehicles
    const allVehicles = await Vehicle.find({});
    console.log(`📊 Total vehicles in database: ${allVehicles.length}`);
    
    if (allVehicles.length > 0) {
      console.log('📋 All vehicles:');
      allVehicles.forEach((vehicle, index) => {
        console.log(`${index + 1}. ID: ${vehicle._id}`);
        console.log(`   Type: ${vehicle.type}`);
        console.log(`   Brand: ${vehicle.brand}`);
        console.log(`   Model: ${vehicle.model}`);
        console.log(`   Driver: ${vehicle.driver}`);
        console.log(`   isActive: ${vehicle.isActive}`);
        console.log(`   approvalStatus: ${vehicle.approvalStatus}`);
        console.log(`   isAvailable: ${vehicle.isAvailable}`);
        console.log(`   pricingReference:`, vehicle.pricingReference);
        console.log(`   pricing:`, vehicle.pricing);
        console.log('   ---');
      });
    }
    
    // Test 2: Check cars specifically
    const cars = await Vehicle.find({ type: 'car' });
    console.log(`\n🚗 Cars found: ${cars.length}`);
    
    if (cars.length > 0) {
      console.log('📋 Car details:');
      cars.forEach((car, index) => {
        console.log(`${index + 1}. ID: ${car._id}`);
        console.log(`   Brand: ${car.brand} ${car.model}`);
        console.log(`   isActive: ${car.isActive}`);
        console.log(`   approvalStatus: ${car.approvalStatus}`);
        console.log(`   isAvailable: ${car.isAvailable}`);
        console.log(`   Driver: ${car.driver}`);
        console.log(`   pricingReference:`, car.pricingReference);
        console.log(`   pricing:`, car.pricing);
        console.log('   ---');
      });
    }
    
    // Test 3: Check approved and active cars
    const approvedActiveCars = await Vehicle.find({ 
      type: 'car', 
      isActive: true, 
      approvalStatus: 'approved' 
    });
    console.log(`\n✅ Approved and active cars: ${approvedActiveCars.length}`);
    
    if (approvedActiveCars.length > 0) {
      console.log('📋 Approved active car details:');
      approvedActiveCars.forEach((car, index) => {
        console.log(`${index + 1}. ID: ${car._id}`);
        console.log(`   Brand: ${car.brand} ${car.model}`);
        console.log(`   Driver: ${car.driver}`);
        console.log(`   pricingReference:`, car.pricingReference);
        console.log(`   pricing:`, car.pricing);
        console.log('   ---');
      });
    }
    
    // Test 4: Check search query that frontend uses
    const searchQuery = {
      isActive: true,
      approvalStatus: 'approved'
    };
    console.log(`\n🔍 Testing search query:`, searchQuery);
    
    const searchResults = await Vehicle.find(searchQuery);
    console.log(`📊 Search results: ${searchResults.length}`);
    
    if (searchResults.length > 0) {
      console.log('📋 Search result details:');
      searchResults.forEach((vehicle, index) => {
        console.log(`${index + 1}. ID: ${vehicle._id}`);
        console.log(`   Type: ${vehicle.type}`);
        console.log(`   Brand: ${vehicle.brand} ${vehicle.model}`);
        console.log(`   Driver: ${vehicle.driver}`);
        console.log(`   pricingReference:`, vehicle.pricingReference);
        console.log(`   pricing:`, vehicle.pricing);
        console.log('   ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing vehicles:', error);
  } finally {
    mongoose.connection.close();
  }
}

testVehicles();
