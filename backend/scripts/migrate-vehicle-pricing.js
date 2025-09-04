const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const VehiclePricing = require('../models/VehiclePricing');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI_PROD || 'mongodb://localhost:27017/chalo_sawari', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function to update vehicle pricing with new distance tiers
const migrateVehiclePricing = async () => {
  try {
    console.log('Starting vehicle pricing migration...');
    
    // Find all vehicles that have pricing data but missing new distance tiers
    const vehicles = await Vehicle.find({
      pricing: { $exists: true },
      $or: [
        { 'pricing.distancePricing.oneWay.200km': { $exists: false } },
        { 'pricing.distancePricing.oneWay.250km': { $exists: false } },
        { 'pricing.distancePricing.oneWay.300km': { $exists: false } },
        { 'pricing.distancePricing.return.200km': { $exists: false } },
        { 'pricing.distancePricing.return.250km': { $exists: false } },
        { 'pricing.distancePricing.return.300km': { $exists: false } }
      ]
    });

    console.log(`Found ${vehicles.length} vehicles to migrate`);

    for (const vehicle of vehicles) {
      console.log(`Migrating vehicle ${vehicle._id} (${vehicle.brand} ${vehicle.model})`);
      
      if (vehicle.pricing && vehicle.pricing.distancePricing) {
        // Update oneWay pricing
        if (vehicle.pricing.distancePricing.oneWay) {
          vehicle.pricing.distancePricing.oneWay['200km'] = vehicle.pricing.distancePricing.oneWay['200km'] || vehicle.pricing.distancePricing.oneWay['150km'] || 0;
          vehicle.pricing.distancePricing.oneWay['250km'] = vehicle.pricing.distancePricing.oneWay['250km'] || vehicle.pricing.distancePricing.oneWay['150km'] || 0;
          vehicle.pricing.distancePricing.oneWay['300km'] = vehicle.pricing.distancePricing.oneWay['300km'] || vehicle.pricing.distancePricing.oneWay['150km'] || 0;
        }
        
        // Update return pricing
        if (vehicle.pricing.distancePricing.return) {
          vehicle.pricing.distancePricing.return['200km'] = vehicle.pricing.distancePricing.return['200km'] || vehicle.pricing.distancePricing.return['150km'] || 0;
          vehicle.pricing.distancePricing.return['250km'] = vehicle.pricing.distancePricing.return['250km'] || vehicle.pricing.distancePricing.return['150km'] || 0;
          vehicle.pricing.distancePricing.return['300km'] = vehicle.pricing.distancePricing.return['300km'] || vehicle.pricing.distancePricing.return['150km'] || 0;
        }
        
        // Update lastUpdated timestamp
        vehicle.pricing.lastUpdated = new Date();
        
        // Save the updated vehicle
        await vehicle.save();
        
        console.log(`✅ Updated vehicle ${vehicle._id}`);
      }
    }

    console.log('✅ Vehicle pricing migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateVehiclePricing();
  await mongoose.connection.close();
  console.log('Migration completed and database connection closed');
};

// Run if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = { migrateVehiclePricing };
