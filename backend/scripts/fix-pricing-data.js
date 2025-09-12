const mongoose = require('mongoose');
const VehiclePricing = require('../models/VehiclePricing');
const Admin = require('../models/Admin');

// Try different connection strings that might be used
const possibleConnections = [
  process.env.MONGODB_URI_PROD,
  'mongodb://localhost:27017/chalo_sawari',
  'mongodb://localhost:27017/chalo-sawari',
  'mongodb://127.0.0.1:27017/chalo_sawari',
  'mongodb://127.0.0.1:27017/chalo-sawari'
];

// Vehicle configurations matching the frontend
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

// Function to clean up and fix pricing data
const fixPricingData = async () => {
  try {
    console.log('🔧 Starting to fix pricing data...');
    
    // Get the first admin user to use as createdBy
    const admin = await Admin.findOne();
    if (!admin) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }
    
    // First, let's see what we have
    console.log('\n📊 Current pricing data:');
    const currentPricing = await VehiclePricing.find({});
    console.log(`Total pricing records: ${currentPricing.length}`);
    
    const carPricing = currentPricing.filter(p => p.category === 'car');
    console.log(`Car pricing records: ${carPricing.length}`);
    
    // Show breakdown
    const breakdown = {};
    carPricing.forEach(p => {
      const key = `${p.vehicleType} - ${p.vehicleModel}`;
      breakdown[key] = (breakdown[key] || 0) + 1;
    });
    
    console.log('\n🚙 Current car pricing breakdown:');
    Object.entries(breakdown).forEach(([key, count]) => {
      console.log(`   ${key}: ${count} records`);
    });
    
    // Now let's clean up and recreate all pricing
    console.log('\n🧹 Cleaning up existing pricing data...');
    
    // Delete all existing pricing records
    const deleteResult = await VehiclePricing.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing pricing records`);
    
    // Now create all pricing records fresh
    console.log('\n🔄 Creating fresh pricing data...');
    
    let totalCreated = 0;
    
    // Process Auto category
    console.log('\n🚗 Processing Auto category...');
    for (const fuelType of vehicleConfigs.auto.fuelTypes) {
      for (const tripType of ['one-way', 'return']) {
        const pricing = new VehiclePricing({
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
        
        await pricing.save();
        console.log(`✅ Created Auto ${fuelType} ${tripType} pricing`);
        totalCreated++;
      }
    }
    
    // Process Car category
    console.log('\n🚙 Processing Car category...');
    for (const vehicleType of vehicleConfigs.car.types) {
      for (const model of vehicleConfigs.car.models[vehicleType]) {
        for (const tripType of ['one-way', 'return']) {
          const pricing = new VehiclePricing({
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
          
          await pricing.save();
          console.log(`✅ Created Car ${vehicleType} ${model} ${tripType} pricing`);
          totalCreated++;
        }
      }
    }
    
    // Process Bus category
    console.log('\n🚌 Processing Bus category...');
    for (const vehicleType of vehicleConfigs.bus.types) {
      for (const model of vehicleConfigs.bus.models[vehicleType]) {
        for (const tripType of ['one-way', 'return']) {
          const pricing = new VehiclePricing({
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
          
          await pricing.save();
          console.log(`✅ Created Bus ${vehicleType} ${model} ${tripType} pricing`);
          totalCreated++;
        }
      }
    }
    
    console.log('\n🎉 Pricing data fix completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total pricing rules created: ${totalCreated}`);
    
    // Show final statistics
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
    
    console.log('\n📊 Final Pricing Statistics:');
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
    
  } catch (error) {
    console.error('❌ Error fixing pricing data:', error);
  }
};

// Run the script
const runScript = async () => {
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  await fixPricingData();
  await mongoose.connection.close();
  console.log('\n✅ Script completed and database connection closed');
};

// Run if this script is executed directly
if (require.main === module) {
  runScript();
}

module.exports = { fixPricingData };
