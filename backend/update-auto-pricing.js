const mongoose = require('mongoose');
const VehiclePricing = require('./models/VehiclePricing');

const updateAutoPricing = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI_PROD || 'mongodb://localhost:27017/chalo_sawari');
    console.log('Connected to MongoDB');
    
    // Find all auto pricing records
    const autoPricingRecords = await VehiclePricing.find({ category: 'auto' });
    console.log(`Found ${autoPricingRecords.length} auto pricing records`);
    
    if (autoPricingRecords.length === 0) {
      console.log('No auto pricing records found. Creating default auto pricing...');
      
      // Create default auto pricing with ₹7/km
      const defaultAutoPricing = new VehiclePricing({
        category: 'auto',
        vehicleType: 'Auto',
        vehicleModel: 'Standard Auto',
        tripType: 'one-way',
        autoPrice: 7, // ₹7 per km
        distancePricing: { '50km': 0, '100km': 0, '150km': 0, '200km': 0, '250km': 0, '300km': 0 },
        isActive: true,
        isDefault: true,
        notes: 'Default auto pricing - ₹7/km'
      });
      
      await defaultAutoPricing.save();
      console.log('✅ Created default auto pricing with ₹7/km');
      
      // Create return trip pricing
      const returnAutoPricing = new VehiclePricing({
        category: 'auto',
        vehicleType: 'Auto',
        vehicleModel: 'Standard Auto',
        tripType: 'return',
        autoPrice: 7, // ₹7 per km (same as one-way)
        distancePricing: { '50km': 0, '100km': 0, '150km': 0, '200km': 0, '250km': 0, '300km': 0 },
        isActive: true,
        isDefault: true,
        notes: 'Default auto pricing - ₹7/km for return trips'
      });
      
      await returnAutoPricing.save();
      console.log('✅ Created default return auto pricing with ₹7/km');
      
    } else {
      // Update existing auto pricing records to ₹7/km
      console.log('Updating existing auto pricing records...');
      
      for (const record of autoPricingRecords) {
        console.log(`Updating ${record.vehicleType} ${record.vehicleModel} (${record.tripType}): ₹${record.autoPrice}/km → ₹7/km`);
        record.autoPrice = 7; // Set to ₹7/km
        record.notes = record.notes ? `${record.notes} - Updated to ₹7/km` : 'Updated to ₹7/km';
        await record.save();
      }
      
      console.log(`✅ Updated ${autoPricingRecords.length} auto pricing records to ₹7/km`);
    }
    
    // Verify the update
    const updatedRecords = await VehiclePricing.find({ category: 'auto' });
    console.log('\n📊 Updated auto pricing records:');
    updatedRecords.forEach(record => {
      console.log(`- ${record.vehicleType} ${record.vehicleModel} (${record.tripType}): ₹${record.autoPrice}/km`);
    });
    
    console.log('\n✅ Auto pricing update completed successfully!');
    console.log('Now 34.1km × ₹7/km = ₹239 (rounded)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating auto pricing:', error);
    process.exit(1);
  }
};

updateAutoPricing();
