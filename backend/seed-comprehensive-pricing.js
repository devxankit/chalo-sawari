const mongoose = require('mongoose');
const VehiclePricing = require('./models/VehiclePricing');
require('dotenv').config();

// Admin ID from your JWT token
const ADMIN_ID = '689c80e32a9f2d6d2880854c';

// Use the same database connection configuration as the main app
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI || 'mongodb://localhost:27017/chalo_sawari';
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('📍 Connection string:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔌 Connection State: ${mongoose.connection.readyState}`);
    
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
};

// Comprehensive pricing data with new structure
const comprehensivePricingData = [
  // ===== AUTO PRICING =====
  {
    category: 'auto',
    vehicleType: 'Auto',
    vehicleModel: 'Standard Auto',
    tripType: 'one-way',
    autoPrice: 200,
    distancePricing: {
      '50km': 0,
      '100km': 0,
      '150km': 0
    },
    notes: 'Standard auto pricing for one-way trips',
    isActive: true,
    isDefault: true,
    createdBy: ADMIN_ID,
    updatedBy: ADMIN_ID
  },
  {
    category: 'auto',
    vehicleType: 'Auto',
    vehicleModel: 'Standard Auto',
    tripType: 'return',
    autoPrice: 350,
    distancePricing: {
      '50km': 0,
      '100km': 0,
      '150km': 0
    },
    notes: 'Standard auto pricing for return trips',
    isActive: true,
    isDefault: true,
    createdBy: ADMIN_ID,
    updatedBy: ADMIN_ID
  },
  {
    category: 'auto',
    vehicleType: 'Auto',
    vehicleModel: 'CNG',
    tripType: 'one-way',
    autoPrice: 180,
    distancePricing: {
      '50km': 0,
      '100km': 0,
      '150km': 0
    },
    notes: 'CNG auto pricing for one-way trips',
    isActive: true,
    isDefault: true,
    createdBy: ADMIN_ID,
    updatedBy: ADMIN_ID
  },
  {
    category: 'auto',
    vehicleType: 'Auto',
    vehicleModel: 'CNG',
    tripType: 'return',
    autoPrice: 320,
    distancePricing: {
      '50km': 0,
      '100km': 0,
      '150km': 0
    },
    notes: 'CNG auto pricing for return trips',
    isActive: true,
    isDefault: true,
    createdBy: ADMIN_ID,
    updatedBy: ADMIN_ID
  },

  // ===== CAR - SEDAN PRICING =====
  {
    category: 'car',
    vehicleType: 'Sedan',
    vehicleModel: 'Honda Amaze',
    tripType: 'one-way',
    autoPrice: 0,
    distancePricing: {
      '50km': 16,
      '100km': 15,
      '150km': 14
    },
    notes: 'Honda Amaze sedan pricing for one-way trips',
    isActive: true,
    isDefault: true,
    createdBy: ADMIN_ID,
    updatedBy: ADMIN_ID
  },
  {
    category: 'car',
    vehicleType: 'Sedan',
    vehicleModel: 'Honda Amaze',
    tripType: 'return',
    autoPrice: 0,
    distancePricing: {
      '50km': 16,
      '100km': 15,
      '150km': 14
    },
    notes: 'Honda Amaze sedan pricing for return trips',
    isActive: true,
    isDefault: true,
    createdBy: ADMIN_ID,
    updatedBy: ADMIN_ID
  },

  // ===== CAR - HATCHBACK PRICING =====
  {
    category: 'car',
    vehicleType: 'Hatchback',
    vehicleModel: 'Swift',
    tripType: 'one-way',
    autoPrice: 0,
    distancePricing: {
      '50km': 14,
      '100km': 13,
      '150km': 12
    },
    notes: 'Swift hatchback pricing for one-way trips',
    isActive: true,
    isDefault: true,
    createdBy: ADMIN_ID,
    updatedBy: ADMIN_ID
  },

  // ===== CAR - SUV PRICING =====
  {
    category: 'car',
    vehicleType: 'SUV',
    vehicleModel: 'Innova Crysta',
    tripType: 'one-way',
    autoPrice: 0,
    distancePricing: {
      '50km': 24,
      '100km': 22,
      '150km': 20
    },
    notes: 'Innova Crysta SUV pricing for one-way trips',
    isActive: true,
    isDefault: true,
    createdBy: ADMIN_ID,
    updatedBy: ADMIN_ID
  },

  // ===== BUS PRICING =====
  {
    category: 'bus',
    vehicleType: 'Mini Bus',
    vehicleModel: 'Tempo Traveller',
    tripType: 'one-way',
    autoPrice: 0,
    distancePricing: {
      '50km': 40,
      '100km': 36,
      '150km': 32
    },
    notes: 'Tempo Traveller mini bus pricing for one-way trips',
    isActive: true,
    isDefault: true,
    createdBy: ADMIN_ID,
    updatedBy: ADMIN_ID
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🚀 Starting comprehensive pricing data seeding...');
    console.log(`👨‍💼 Using Admin ID: ${ADMIN_ID}`);
    
    // Clear existing pricing data
    await VehiclePricing.deleteMany({});
    console.log('🧹 Cleared existing pricing data');
    
    // Insert new pricing data
    const result = await VehiclePricing.insertMany(comprehensivePricingData);
    console.log(`✅ Successfully inserted ${result.length} pricing records`);
    
    // Display summary
    console.log('\n=== SEEDING SUMMARY ===');
    console.log(`Total pricing records: ${result.length}`);
    
    // Count by category
    const autoCount = result.filter(r => r.category === 'auto').length;
    const carCount = result.filter(r => r.category === 'car').length;
    const busCount = result.filter(r => r.category === 'bus').length;
    
    console.log(`Auto: ${autoCount} records`);
    console.log(`Cars: ${carCount} records`);
    console.log(`Buses: ${busCount} records`);
    
    // Count by trip type
    const oneWayCount = result.filter(r => r.tripType === 'one-way').length;
    const returnCount = result.filter(r => r.tripType === 'return').length;
    
    console.log(`One-way trips: ${oneWayCount} records`);
    console.log(`Return trips: ${returnCount} records`);
    
    console.log('\n=== VEHICLE MODELS INCLUDED ===');
    
    // Auto models
    const autoModels = [...new Set(result.filter(r => r.category === 'auto').map(r => r.vehicleModel))];
    console.log(`Auto: ${autoModels.join(', ')}`);
    
    // Car models by type
    const carTypes = [...new Set(result.filter(r => r.category === 'car').map(r => r.vehicleType))];
    carTypes.forEach(type => {
      const models = [...new Set(result.filter(r => r.category === 'car' && r.vehicleType === type).map(r => r.vehicleModel))];
      console.log(`${type}: ${models.join(', ')}`);
    });
    
    // Bus models by type
    const busTypes = [...new Set(result.filter(r => r.category === 'bus').map(r => r.vehicleType))];
    busTypes.forEach(type => {
      const models = [...new Set(result.filter(r => r.category === 'bus' && r.vehicleType === type).map(r => r.vehicleModel))];
      console.log(`${type}: ${models.join(', ')}`);
    });
    
    console.log('\n🎉 Comprehensive pricing data seeding completed successfully!');
    console.log('\n👨‍💼 Admin can now:');
    console.log('1. View all pricing in AdminPriceManagement page');
    console.log('2. Edit existing pricing');
    console.log('3. Add new pricing for additional models');
    console.log('4. Delete pricing (soft delete)');
    console.log('5. Bulk update pricing');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the seeding
if (require.main === module) {
  connectDB().then(() => {
    seedDatabase();
  });
}

module.exports = { seedDatabase, comprehensivePricingData };
