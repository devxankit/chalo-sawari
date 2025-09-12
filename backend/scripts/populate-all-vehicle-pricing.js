const mongoose = require('mongoose');
const VehiclePricing = require('../models/VehiclePricing');
const Admin = require('../models/Admin');

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

// Function to populate pricing for all vehicle models
const populateAllVehiclePricing = async () => {
  try {
    console.log('Starting to populate pricing for all vehicle models...');
    
    // Get the first admin user to use as createdBy
    const admin = await Admin.findOne();
    if (!admin) {
      console.error('❌ No admin user found. Please create an admin user first.');
      return;
    }
    
    let totalCreated = 0;
    let totalSkipped = 0;
    
    // Process Auto category
    console.log('\n🚗 Processing Auto category...');
    for (const fuelType of vehicleConfigs.auto.fuelTypes) {
      for (const tripType of ['one-way', 'return']) {
        const existingPricing = await VehiclePricing.findOne({
          category: 'auto',
          vehicleType: 'Auto',
          vehicleModel: fuelType,
          tripType: tripType
        });
        
        if (existingPricing) {
          console.log(`⏭️  Skipping Auto ${fuelType} ${tripType} - already exists`);
          totalSkipped++;
          continue;
        }
        
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
          const existingPricing = await VehiclePricing.findOne({
            category: 'car',
            vehicleType: vehicleType,
            vehicleModel: model,
            tripType: tripType
          });
          
          if (existingPricing) {
            console.log(`⏭️  Skipping Car ${vehicleType} ${model} ${tripType} - already exists`);
            totalSkipped++;
            continue;
          }
          
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
          const existingPricing = await VehiclePricing.findOne({
            category: 'bus',
            vehicleType: vehicleType,
            vehicleModel: model,
            tripType: tripType
          });
          
          if (existingPricing) {
            console.log(`⏭️  Skipping Bus ${vehicleType} ${model} ${tripType} - already exists`);
            totalSkipped++;
            continue;
          }
          
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
    
    console.log('\n🎉 Pricing population completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total pricing rules created: ${totalCreated}`);
    console.log(`   - Total pricing rules skipped: ${totalSkipped}`);
    console.log(`   - Total pricing rules processed: ${totalCreated + totalSkipped}`);
    
  } catch (error) {
    console.error('❌ Error populating vehicle pricing:', error);
  }
};

// Function to show current pricing statistics
const showPricingStats = async () => {
  try {
    console.log('\n📊 Current Pricing Statistics:');
    
    const stats = await VehiclePricing.aggregate([
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
    
    stats.forEach(stat => {
      console.log(`   ${stat._id.category} ${stat._id.tripType}: ${stat.count} pricing rules`);
    });
    
    const totalCount = await VehiclePricing.countDocuments();
    console.log(`\n   Total pricing rules: ${totalCount}`);
    
  } catch (error) {
    console.error('❌ Error getting pricing stats:', error);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await showPricingStats();
  await populateAllVehiclePricing();
  await showPricingStats();
  await mongoose.connection.close();
  console.log('\n✅ Script completed and database connection closed');
};

// Run if this script is executed directly
if (require.main === module) {
  runScript();
}

module.exports = { populateAllVehiclePricing, showPricingStats };
