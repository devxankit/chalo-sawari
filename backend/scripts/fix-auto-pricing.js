const mongoose = require('mongoose');
const VehiclePricing = require('../models/VehiclePricing');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI_PROD || 'mongodb://localhost:27017/chalo_sawari', {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix auto pricing - set proper fixed prices instead of per-km rates
const fixAutoPricing = async () => {
  try {
    console.log('🔧 Starting to fix auto pricing...');
    
    // Get all auto pricing records
    const autoPricingRecords = await VehiclePricing.find({
      category: 'auto',
      isActive: true
    });
    
    console.log(`📊 Found ${autoPricingRecords.length} auto pricing records to fix`);
    
    let updatedCount = 0;
    
    for (const record of autoPricingRecords) {
      console.log(`\n🔍 Processing: ${record.vehicleModel} Auto (${record.tripType})`);
      console.log(`   Current autoPrice: ₹${record.autoPrice}`);
      
      // Set proper fixed prices based on fuel type and trip type
      let newAutoPrice = 0;
      
      switch (record.vehicleModel) {
        case 'CNG':
          newAutoPrice = record.tripType === 'one-way' ? 200 : 350; // ₹200 one-way, ₹350 return
          break;
        case 'Petrol':
          newAutoPrice = record.tripType === 'one-way' ? 250 : 400; // ₹250 one-way, ₹400 return
          break;
        case 'Electric':
          newAutoPrice = record.tripType === 'one-way' ? 300 : 500; // ₹300 one-way, ₹500 return
          break;
        case 'Diesel':
          newAutoPrice = record.tripType === 'one-way' ? 220 : 380; // ₹220 one-way, ₹380 return
          break;
        default:
          newAutoPrice = record.tripType === 'one-way' ? 200 : 350; // Default pricing
      }
      
      // Only update if the price is different
      if (record.autoPrice !== newAutoPrice) {
        record.autoPrice = newAutoPrice;
        record.notes = `Fixed pricing for ${record.vehicleModel} Auto ${record.tripType} trip - Updated on ${new Date().toISOString()}`;
        
        await record.save();
        console.log(`   ✅ Updated to: ₹${newAutoPrice}`);
        updatedCount++;
      } else {
        console.log(`   ⏭️  No change needed`);
      }
    }
    
    console.log(`\n🎉 Auto pricing fix completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Total records processed: ${autoPricingRecords.length}`);
    console.log(`   - Records updated: ${updatedCount}`);
    console.log(`   - Records unchanged: ${autoPricingRecords.length - updatedCount}`);
    
  } catch (error) {
    console.error('❌ Error fixing auto pricing:', error);
  }
};

// Show current auto pricing
const showAutoPricing = async () => {
  try {
    console.log('\n📊 Current Auto Pricing:');
    
    const autoPricing = await VehiclePricing.find({
      category: 'auto',
      isActive: true
    }).sort({ vehicleModel: 1, tripType: 1 });
    
    console.log('\n   Fuel Type | Trip Type | Auto Price | Notes');
    console.log('   ----------|-----------|------------|------------------');
    
    autoPricing.forEach(record => {
      const notes = record.notes ? record.notes.substring(0, 15) + '...' : 'No notes';
      console.log(`   ${record.vehicleModel.padEnd(10)} | ${record.tripType.padEnd(9)} | ₹${record.autoPrice.toString().padEnd(10)} | ${notes}`);
    });
    
  } catch (error) {
    console.error('❌ Error showing auto pricing:', error);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await showAutoPricing();
  await fixAutoPricing();
  await showAutoPricing();
  await mongoose.connection.close();
  console.log('\n✅ Script completed and database connection closed');
};

// Run if this script is executed directly
if (require.main === module) {
  runScript();
}

module.exports = { fixAutoPricing, showAutoPricing };
