const mongoose = require('mongoose');
const VehiclePricing = require('./models/VehiclePricing');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI_PROD || 'mongodb://localhost:27017/chalo-sawari', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Initial pricing data
const initialPricingData = [
  // Auto-Ricksaw Pricing
  {
    category: 'auto',
    vehicleType: 'Fuel Auto-Ricksaw',
    vehicleModel: 'Standard',
    tripType: 'one-way',
    autoPrice: 200,
    distancePricing: {
      '50km': 0,
      '100km': 0,
      '150km': 0
    },
    notes: 'Standard fuel auto-ricksaw pricing',
    isDefault: true,
    isActive: true
  },
  {
    category: 'auto',
    vehicleType: 'Fuel Auto-Ricksaw',
    vehicleModel: 'Standard',
    tripType: 'return',
    autoPrice: 350,
    distancePricing: {
      '50km': 0,
      '100km': 0,
      '150km': 0
    },
    notes: 'Standard fuel auto-ricksaw return trip pricing',
    isDefault: true,
    isActive: true
  },
  {
    category: 'auto',
    vehicleType: 'Electric Auto-Ricksaw',
    vehicleModel: 'Standard',
    tripType: 'one-way',
    autoPrice: 250,
    distancePricing: {
      '50km': 0,
      '100km': 0,
      '150km': 0
    },
    notes: 'Electric auto-ricksaw pricing',
    isDefault: true,
    isActive: true
  },
  {
    category: 'auto',
    vehicleType: 'Electric Auto-Ricksaw',
    vehicleModel: 'Standard',
    tripType: 'return',
    autoPrice: 400,
    distancePricing: {
      '50km': 0,
      '100km': 0,
      '150km': 0
    },
    notes: 'Electric auto-ricksaw return trip pricing',
    isDefault: true,
    isActive: true
  }
];

// Function to seed the database
async function seedDatabase() {
  try {
    console.log('🌱 Starting to seed vehicle pricing data...');
    
    // Clear existing pricing data
    await VehiclePricing.deleteMany({});
    console.log('🗑️  Cleared existing pricing data');
    
    // Insert new pricing data
    const pricingData = initialPricingData.map(item => ({
      ...item,
      createdBy: '000000000000000000000000', // Placeholder admin ID
      updatedBy: '000000000000000000000000'  // Placeholder admin ID
    }));
    
    const result = await VehiclePricing.insertMany(pricingData);
    console.log(`✅ Successfully seeded ${result.length} pricing records`);
    
    // Display summary
    const categories = await VehiclePricing.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    console.log('\n📊 Pricing Summary:');
    categories.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count} records`);
    });
    
    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding function
seedDatabase();
