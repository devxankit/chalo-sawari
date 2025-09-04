const mongoose = require('mongoose');
const VehiclePricing = require('../models/VehiclePricing');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chalo-sawari', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function to add missing distance tiers
const migratePricingTiers = async () => {
  try {
    console.log('Starting pricing tiers migration...');
    
    // Find all pricing records that don't have the new distance tiers
    const pricingRecords = await VehiclePricing.find({
      $or: [
        { 'distancePricing.200km': { $exists: false } },
        { 'distancePricing.250km': { $exists: false } },
        { 'distancePricing.300km': { $exists: false } }
      ]
    });

    console.log(`Found ${pricingRecords.length} pricing records to migrate`);

    for (const pricing of pricingRecords) {
      console.log(`Migrating pricing for ${pricing.category} ${pricing.vehicleType} ${pricing.vehicleModel}`);
      
      // Update distance pricing to include new tiers
      const updatedDistancePricing = {
        ...pricing.distancePricing,
        '200km': pricing.distancePricing['200km'] || pricing.distancePricing['150km'] || 0,
        '250km': pricing.distancePricing['250km'] || pricing.distancePricing['150km'] || 0,
        '300km': pricing.distancePricing['300km'] || pricing.distancePricing['150km'] || 0
      };

      // Update the pricing record
      await VehiclePricing.findByIdAndUpdate(
        pricing._id,
        { 
          distancePricing: updatedDistancePricing,
          updatedAt: new Date()
        }
      );

      console.log(`✅ Updated pricing for ${pricing.category} ${pricing.vehicleType} ${pricing.vehicleModel}`);
    }

    console.log('✅ Pricing tiers migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migratePricingTiers();
  await mongoose.connection.close();
  console.log('Migration completed and database connection closed');
};

// Run if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { migratePricingTiers };
