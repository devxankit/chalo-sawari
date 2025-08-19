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
    distancePricing: {
      '50km': 30,
      '100km': 28,
      '150km': 25,
      '200km': 22
    },
    additionalCharges: {
      baseFare: 50,
      waitingCharge: 10,
      nightCharge: 20,
      acCharge: 0,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.0,
      returnTripDiscount: 0
    },
    notes: 'Standard fuel auto-ricksaw pricing',
    isDefault: true
  },
  {
    category: 'auto',
    vehicleType: 'Fuel Auto-Ricksaw',
    vehicleModel: 'Standard',
    tripType: 'return',
    distancePricing: {
      '50km': 28,
      '100km': 26,
      '150km': 24,
      '200km': 21
    },
    additionalCharges: {
      baseFare: 50,
      waitingCharge: 10,
      nightCharge: 20,
      acCharge: 0,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.0,
      returnTripDiscount: 5
    },
    notes: 'Standard fuel auto-ricksaw return trip pricing',
    isDefault: true
  },
  {
    category: 'auto',
    vehicleType: 'Electric Auto-Ricksaw',
    vehicleModel: 'Standard',
    tripType: 'one-way',
    distancePricing: {
      '50km': 35,
      '100km': 33,
      '150km': 30,
      '200km': 27
    },
    additionalCharges: {
      baseFare: 60,
      waitingCharge: 15,
      nightCharge: 25,
      acCharge: 0,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.0,
      returnTripDiscount: 0
    },
    notes: 'Electric auto-ricksaw pricing',
    isDefault: true
  },
  {
    category: 'auto',
    vehicleType: 'Electric Auto-Ricksaw',
    vehicleModel: 'Standard',
    tripType: 'return',
    distancePricing: {
      '50km': 32,
      '100km': 30,
      '150km': 28,
      '200km': 25
    },
    additionalCharges: {
      baseFare: 60,
      waitingCharge: 15,
      nightCharge: 25,
      acCharge: 0,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.0,
      returnTripDiscount: 8
    },
    notes: 'Electric auto-ricksaw return trip pricing',
    isDefault: true
  },
  {
    category: 'auto',
    vehicleType: 'CNG Auto-Ricksaw',
    vehicleModel: 'Standard',
    tripType: 'one-way',
    distancePricing: {
      '50km': 32,
      '100km': 30,
      '150km': 28,
      '200km': 25
    },
    additionalCharges: {
      baseFare: 55,
      waitingCharge: 12,
      nightCharge: 22,
      acCharge: 0,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.0,
      returnTripDiscount: 0
    },
    notes: 'CNG auto-ricksaw pricing',
    isDefault: true
  },
  {
    category: 'auto',
    vehicleType: 'CNG Auto-Ricksaw',
    vehicleModel: 'Standard',
    tripType: 'return',
    distancePricing: {
      '50km': 30,
      '100km': 28,
      '150km': 26,
      '200km': 24
    },
    additionalCharges: {
      baseFare: 55,
      waitingCharge: 12,
      nightCharge: 22,
      acCharge: 0,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.0,
      returnTripDiscount: 6
    },
    notes: 'CNG auto-ricksaw return trip pricing',
    isDefault: true
  },

  // Car Pricing - Sedan
  {
    category: 'car',
    vehicleType: 'Sedan',
    vehicleModel: 'Honda Amaze',
    tripType: 'one-way',
    distancePricing: {
      '50km': 42,
      '100km': 40,
      '150km': 38,
      '200km': 35
    },
    additionalCharges: {
      baseFare: 100,
      waitingCharge: 20,
      nightCharge: 30,
      acCharge: 50,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.2,
      returnTripDiscount: 0
    },
    notes: 'Honda Amaze sedan pricing',
    isDefault: true
  },
  {
    category: 'car',
    vehicleType: 'Sedan',
    vehicleModel: 'Honda Amaze',
    tripType: 'return',
    distancePricing: {
      '50km': 38,
      '100km': 36,
      '150km': 34,
      '200km': 32
    },
    additionalCharges: {
      baseFare: 100,
      waitingCharge: 20,
      nightCharge: 30,
      acCharge: 50,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.2,
      returnTripDiscount: 10
    },
    notes: 'Honda Amaze sedan return trip pricing',
    isDefault: true
  },
  {
    category: 'car',
    vehicleType: 'Sedan',
    vehicleModel: 'Swift Dzire',
    tripType: 'one-way',
    distancePricing: {
      '50km': 40,
      '100km': 38,
      '150km': 36,
      '200km': 34
    },
    additionalCharges: {
      baseFare: 90,
      waitingCharge: 18,
      nightCharge: 28,
      acCharge: 45,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.1,
      returnTripDiscount: 0
    },
    notes: 'Swift Dzire sedan pricing',
    isDefault: true
  },
  {
    category: 'car',
    vehicleType: 'Sedan',
    vehicleModel: 'Swift Dzire',
    tripType: 'return',
    distancePricing: {
      '50km': 36,
      '100km': 34,
      '150km': 32,
      '200km': 30
    },
    additionalCharges: {
      baseFare: 90,
      waitingCharge: 18,
      nightCharge: 28,
      acCharge: 45,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.1,
      returnTripDiscount: 10
    },
    notes: 'Swift Dzire sedan return trip pricing',
    isDefault: true
  },

  // Car Pricing - Hatchback
  {
    category: 'car',
    vehicleType: 'Hatchback',
    vehicleModel: 'Wagon R',
    tripType: 'one-way',
    distancePricing: {
      '50km': 32,
      '100km': 30,
      '150km': 28,
      '200km': 26
    },
    additionalCharges: {
      baseFare: 80,
      waitingCharge: 15,
      nightCharge: 25,
      acCharge: 40,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.0,
      returnTripDiscount: 0
    },
    notes: 'Wagon R hatchback pricing',
    isDefault: true
  },
  {
    category: 'car',
    vehicleType: 'Hatchback',
    vehicleModel: 'Wagon R',
    tripType: 'return',
    distancePricing: {
      '50km': 29,
      '100km': 27,
      '150km': 25,
      '200km': 23
    },
    additionalCharges: {
      baseFare: 80,
      waitingCharge: 15,
      nightCharge: 25,
      acCharge: 40,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.0,
      returnTripDiscount: 10
    },
    notes: 'Wagon R hatchback return trip pricing',
    isDefault: true
  },

  // Car Pricing - SUV
  {
    category: 'car',
    vehicleType: 'SUV',
    vehicleModel: 'Scorpio N',
    tripType: 'one-way',
    distancePricing: {
      '50km': 55,
      '100km': 53,
      '150km': 51,
      '200km': 49
    },
    additionalCharges: {
      baseFare: 150,
      waitingCharge: 25,
      nightCharge: 40,
      acCharge: 60,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.3,
      returnTripDiscount: 0
    },
    notes: 'Scorpio N SUV pricing',
    isDefault: true
  },
  {
    category: 'car',
    vehicleType: 'SUV',
    vehicleModel: 'Scorpio N',
    tripType: 'return',
    distancePricing: {
      '50km': 50,
      '100km': 48,
      '150km': 46,
      '200km': 44
    },
    additionalCharges: {
      baseFare: 150,
      waitingCharge: 25,
      nightCharge: 40,
      acCharge: 60,
      sleeperCharge: 0
    },
    modifiers: {
      surgeMultiplier: 1.3,
      returnTripDiscount: 10
    },
    notes: 'Scorpio N SUV return trip pricing',
    isDefault: true
  },

  // Bus Pricing
  {
    category: 'bus',
    vehicleType: 'AC Sleeper',
    vehicleModel: 'Standard',
    tripType: 'one-way',
    distancePricing: {
      '50km': 120,
      '100km': 115,
      '150km': 110,
      '200km': 105
    },
    additionalCharges: {
      baseFare: 200,
      waitingCharge: 50,
      nightCharge: 80,
      acCharge: 100,
      sleeperCharge: 150
    },
    modifiers: {
      surgeMultiplier: 1.5,
      returnTripDiscount: 0
    },
    notes: 'AC Sleeper bus pricing',
    isDefault: true
  },
  {
    category: 'bus',
    vehicleType: 'AC Sleeper',
    vehicleModel: 'Standard',
    tripType: 'return',
    distancePricing: {
      '50km': 108,
      '100km': 104,
      '150km': 99,
      '200km': 95
    },
    additionalCharges: {
      baseFare: 200,
      waitingCharge: 50,
      nightCharge: 80,
      acCharge: 100,
      sleeperCharge: 150
    },
    modifiers: {
      surgeMultiplier: 1.5,
      returnTripDiscount: 10
    },
    notes: 'AC Sleeper bus return trip pricing',
    isDefault: true
  },
  {
    category: 'bus',
    vehicleType: 'Non-AC Sleeper',
    vehicleModel: 'Standard',
    tripType: 'one-way',
    distancePricing: {
      '50km': 100,
      '100km': 95,
      '150km': 90,
      '200km': 85
    },
    additionalCharges: {
      baseFare: 150,
      waitingCharge: 40,
      nightCharge: 60,
      acCharge: 0,
      sleeperCharge: 120
    },
    modifiers: {
      surgeMultiplier: 1.3,
      returnTripDiscount: 0
    },
    notes: 'Non-AC Sleeper bus pricing',
    isDefault: true
  },
  {
    category: 'bus',
    vehicleType: 'Non-AC Sleeper',
    vehicleModel: 'Standard',
    tripType: 'return',
    distancePricing: {
      '50km': 90,
      '100km': 86,
      '150km': 81,
      '200km': 77
    },
    additionalCharges: {
      baseFare: 150,
      waitingCharge: 40,
      nightCharge: 60,
      acCharge: 0,
      sleeperCharge: 120
    },
    modifiers: {
      surgeMultiplier: 1.3,
      returnTripDiscount: 10
    },
    notes: 'Non-AC Sleeper bus return trip pricing',
    isDefault: true
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
