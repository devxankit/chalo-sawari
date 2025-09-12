const mongoose = require('mongoose');
const VehiclePricing = require('../models/VehiclePricing');
const Admin = require('../models/Admin');

// Try different connection strings
const possibleConnections = [
  process.env.MONGODB_URI_PROD,
  'mongodb://localhost:27017/chalo_sawari',
  'mongodb://localhost:27017/chalo-sawari',
  'mongodb://127.0.0.1:27017/chalo_sawari',
  'mongodb://127.0.0.1:27017/chalo-sawari'
];

// Vehicle configurations as provided by user
const vehicleConfigs = {
  auto: {
    types: ['Auto'],
    fuelTypes: ['CNG', 'Petrol', 'Electric', 'Diesel']
  },
  car: {
    types: ['Sedan', 'Hatchback', 'SUV'],
    models: {
      'Sedan': ['Honda Amaze', 'Swift Dzire', 'Honda City', 'Suzuki Ciaz', 'Hyundai Aura', 'Verna', 'Tata Tigor', 'Skoda Slavia'],
      'Hatchback': ['Baleno', 'Hundai i20', 'Renault Kwid Toyota Glanza', 'Alto K10', 'Calerio Maruti', 'Ignis Maruti', 'Swift Vxi,Lxi,Vdi', 'WagonR', 'Polo', 'Tata Altroz', 'Tata Tiago'],
      'SUV': ['Hundai Extor', 'Grand Vitara Brezza Suzuki', 'Suzuki Vitara Brezza', 'XUV 3x0', 'XUV 700', 'Tata Punch', 'Kia Seltos', 'Tata Harrier', 'Tata Nexon', 'Innova Crysta', 'Scorpio N', 'Scorpio', 'XUV500', 'Nexon EV', 'Hundai Creta', 'Hundai Venue', 'Bolereo Plus', 'Bolereo', 'Bolereo Neo', 'Fronx Maruti Suzuki', 'Ertiga Maruti Suzuki', 'XI Maruti Suzuki', 'Fortuner']
    }
  },
  bus: {
    types: ['Mini Bus', 'Luxury Bus', 'Traveller'],
    models: {
      'Mini Bus': ['32-Seater', '40-Seater', '52-Seater'],
      'Luxury Bus': ['45-Seater'],
      'Traveller': ['13-Seater', '17-Seater', '26-Seater']
    }
  }
};

// Default pricing templates
const defaultPricing = {
  auto: {
    oneWay: 15, // ₹15 per km
    return: 15  // ₹15 per km
  },
  car: {
    oneWay: {
      '50km': 12,
      '100km': 10,
      '150km': 8,
      '200km': 7,
      '250km': 6,
      '300km': 6
    },
    return: {
      '50km': 12,
      '100km': 10,
      '150km': 8,
      '200km': 7,
      '250km': 6,
      '300km': 6
    }
  },
  bus: {
    oneWay: {
      '50km': 15,
      '100km': 12,
      '150km': 10,
      '200km': 8,
      '250km': 7,
      '300km': 6
    },
    return: {
      '50km': 15,
      '100km': 12,
      '150km': 10,
      '200km': 8,
      '250km': 7,
      '300km': 6
    }
  }
};

// Connect to MongoDB
const connectDB = async () => {
  for (const connectionString of possibleConnections) {
    if (!connectionString) continue;
    
    try {
      console.log(`🔄 Trying to connect to: ${connectionString.replace(/\/\/.*@/, '//***:***@')}`);
      
      await mongoose.connect(connectionString, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      });
      
      console.log('✅ MongoDB connected successfully');
      return true;
    } catch (error) {
      console.log(`❌ Failed to connect to: ${connectionString.replace(/\/\/.*@/, '//***:***@')}`);
      continue;
    }
  }
  
  console.error('❌ Could not connect to any MongoDB instance');
  return false;
};

// Function to create all pricing data
const createAllPricing = async () => {
  try {
    console.log('🚀 Starting to create all pricing data...');
    
    // Get admin user
    const admin = await Admin.findOne();
    if (!admin) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }
    
    console.log(`👤 Using admin: ${admin.email || admin.name || admin._id}`);
    
    // Check current state
    const currentCount = await VehiclePricing.countDocuments();
    console.log(`📊 Current pricing records: ${currentCount}`);
    
    if (currentCount > 0) {
      console.log('⚠️  Warning: There are existing pricing records. This will add new ones.');
    }
    
    let totalCreated = 0;
    const allPricingData = [];
    
    // Generate all pricing data
    console.log('\n📝 Generating pricing data...');
    
    // Auto category
    console.log('\n🚗 Processing Auto category...');
    for (const fuelType of vehicleConfigs.auto.fuelTypes) {
      for (const tripType of ['one-way', 'return']) {
        allPricingData.push({
          category: 'auto',
          vehicleType: 'Auto',
          vehicleModel: fuelType,
          tripType: tripType,
          autoPrice: defaultPricing.auto[tripType],
          distancePricing: {
            '50km': 0,
            '100km': 0,
            '150km': 0,
            '200km': 0,
            '250km': 0,
            '300km': 0
          },
          isActive: true,
          isDefault: false,
          createdBy: admin._id,
          notes: `Default pricing for Auto ${fuelType} ${tripType} trip`
        });
        console.log(`   ✅ Auto ${fuelType} ${tripType}`);
      }
    }
    
    // Car category
    console.log('\n🚙 Processing Car category...');
    for (const vehicleType of vehicleConfigs.car.types) {
      console.log(`   📋 Processing ${vehicleType}...`);
      for (const model of vehicleConfigs.car.models[vehicleType]) {
        for (const tripType of ['one-way', 'return']) {
          allPricingData.push({
            category: 'car',
            vehicleType: vehicleType,
            vehicleModel: model,
            tripType: tripType,
            autoPrice: 0,
            distancePricing: defaultPricing.car[tripType],
            isActive: true,
            isDefault: false,
            createdBy: admin._id,
            notes: `Default pricing for ${vehicleType} ${model} ${tripType} trip`
          });
        }
        console.log(`     ✅ ${model} (One Way & Return)`);
      }
    }
    
    // Bus category
    console.log('\n🚌 Processing Bus category...');
    for (const vehicleType of vehicleConfigs.bus.types) {
      console.log(`   📋 Processing ${vehicleType}...`);
      for (const model of vehicleConfigs.bus.models[vehicleType]) {
        for (const tripType of ['one-way', 'return']) {
          allPricingData.push({
            category: 'bus',
            vehicleType: vehicleType,
            vehicleModel: model,
            tripType: tripType,
            autoPrice: 0,
            distancePricing: defaultPricing.bus[tripType],
            isActive: true,
            isDefault: false,
            createdBy: admin._id,
            notes: `Default pricing for ${vehicleType} ${model} ${tripType} trip`
          });
        }
        console.log(`     ✅ ${model} (One Way & Return)`);
      }
    }
    
    console.log(`\n📊 Generated ${allPricingData.length} pricing records`);
    
    // Insert all data
    console.log('\n💾 Inserting all pricing data...');
    const createdPricing = await VehiclePricing.insertMany(allPricingData);
    totalCreated = createdPricing.length;
    
    console.log(`✅ Successfully created ${totalCreated} pricing records`);
    
    // Show final statistics
    console.log('\n📊 Final Statistics:');
    
    const finalStats = await VehiclePricing.aggregate([
      {
        $group: {
          _id: {
            category: '$category',
            tripType: '$tripType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.category': 1, '_id.tripType': 1 }
      }
    ]);
    
    finalStats.forEach(stat => {
      console.log(`   ${stat._id.category} ${stat._id.tripType}: ${stat.count} pricing rules`);
    });
    
    const totalCount = await VehiclePricing.countDocuments();
    console.log(`\n   Total pricing rules: ${totalCount}`);
    
    // Show car breakdown
    const carStats = await VehiclePricing.aggregate([
      { $match: { category: 'car' } },
      {
        $group: {
          _id: {
            vehicleType: '$vehicleType',
            tripType: '$tripType'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.vehicleType': 1, '_id.tripType': 1 }
      }
    ]);
    
    console.log('\n🚙 Car Pricing Breakdown:');
    carStats.forEach(stat => {
      console.log(`   ${stat._id.vehicleType} ${stat._id.tripType}: ${stat.count} pricing rules`);
    });
    
    // Calculate expected vs actual
    const expectedAutoEntries = 4 * 2; // 4 fuel types × 2 trip types
    const expectedCarEntries = (8 + 11 + 23) * 2; // (Sedans + Hatchbacks + SUVs) × 2 trip types
    const expectedBusEntries = (3 + 1 + 3) * 2; // (Mini Bus + Luxury Bus + Traveller) × 2 trip types
    const expectedTotal = expectedAutoEntries + expectedCarEntries + expectedBusEntries;
    
    console.log('\n🎯 Verification:');
    console.log(`   Expected Auto entries: ${expectedAutoEntries}`);
    console.log(`   Expected Car entries: ${expectedCarEntries}`);
    console.log(`   Expected Bus entries: ${expectedBusEntries}`);
    console.log(`   Expected Total: ${expectedTotal}`);
    console.log(`   Actual Total: ${totalCount}`);
    console.log(`   Match: ${expectedTotal === totalCount ? '✅ YES' : '❌ NO'}`);
    
    if (expectedTotal === totalCount) {
      console.log('\n🎉 SUCCESS! All pricing data created successfully!');
      console.log('🎯 You should now see all vehicles in your admin panel!');
    } else {
      console.log('\n⚠️  WARNING: Expected and actual counts do not match!');
    }
    
  } catch (error) {
    console.error('❌ Error creating pricing data:', error);
  }
};

// Run the script
const runScript = async () => {
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  await createAllPricing();
  await mongoose.connection.close();
  console.log('\n✅ Script completed and database connection closed');
};

// Run if this script is executed directly
if (require.main === module) {
  runScript();
}

module.exports = { createAllPricing };
