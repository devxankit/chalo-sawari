const axios = require('axios');

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

// Function to generate all pricing data
const generateAllPricingData = () => {
  const pricingData = [];
  
  // Process Auto category
  console.log('🚗 Generating Auto pricing data...');
  for (const fuelType of vehicleConfigs.auto.fuelTypes) {
    for (const tripType of ['one-way', 'return']) {
      pricingData.push({
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
        notes: `Default pricing for Auto ${fuelType} ${tripType} trip`,
        isActive: true,
        isDefault: false
      });
    }
  }
  
  // Process Car category
  console.log('🚙 Generating Car pricing data...');
  for (const vehicleType of vehicleConfigs.car.types) {
    for (const model of vehicleConfigs.car.models[vehicleType]) {
      for (const tripType of ['one-way', 'return']) {
        pricingData.push({
          category: 'car',
          vehicleType: vehicleType,
          vehicleModel: model,
          tripType: tripType,
          autoPrice: 0,
          distancePricing: defaultPricing.car[tripType],
          notes: `Default pricing for ${vehicleType} ${model} ${tripType} trip`,
          isActive: true,
          isDefault: false
        });
      }
    }
  }
  
  // Process Bus category
  console.log('🚌 Generating Bus pricing data...');
  for (const vehicleType of vehicleConfigs.bus.types) {
    for (const model of vehicleConfigs.bus.models[vehicleType]) {
      for (const tripType of ['one-way', 'return']) {
        pricingData.push({
          category: 'bus',
          vehicleType: vehicleType,
          vehicleModel: model,
          tripType: tripType,
          autoPrice: 0,
          distancePricing: defaultPricing.bus[tripType],
          notes: `Default pricing for ${vehicleType} ${model} ${tripType} trip`,
          isActive: true,
          isDefault: false
        });
      }
    }
  }
  
  return pricingData;
};

// Function to populate pricing via API
const populatePricingViaAPI = async (adminToken) => {
  try {
    console.log('🚀 Starting to populate pricing via API...');
    
    const pricingData = generateAllPricingData();
    console.log(`📊 Generated ${pricingData.length} pricing records`);
    
    // Split into batches of 50 to avoid overwhelming the server
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < pricingData.length; i += batchSize) {
      batches.push(pricingData.slice(i, i + batchSize));
    }
    
    console.log(`📦 Processing ${batches.length} batches...`);
    
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} records)...`);
      
      try {
        const response = await axios.post('http://localhost:5000/api/admin/vehicle-pricing/bulk', {
          pricingData: batch
        }, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.data.success) {
          const results = response.data.data;
          const created = results.filter(r => r.action === 'created').length;
          const updated = results.filter(r => r.action === 'updated').length;
          const errors = results.filter(r => r.action === 'error').length;
          
          totalCreated += created;
          totalUpdated += updated;
          totalErrors += errors;
          
          console.log(`✅ Batch ${i + 1} completed: ${created} created, ${updated} updated, ${errors} errors`);
        } else {
          console.error(`❌ Batch ${i + 1} failed:`, response.data.message);
          totalErrors += batch.length;
        }
      } catch (error) {
        console.error(`❌ Batch ${i + 1} failed:`, error.response?.data?.message || error.message);
        totalErrors += batch.length;
      }
    }
    
    console.log('\n🎉 Pricing population completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total pricing rules created: ${totalCreated}`);
    console.log(`   - Total pricing rules updated: ${totalUpdated}`);
    console.log(`   - Total errors: ${totalErrors}`);
    console.log(`   - Total processed: ${totalCreated + totalUpdated + totalErrors}`);
    
  } catch (error) {
    console.error('❌ Error populating pricing:', error.response?.data?.message || error.message);
  }
};

// Function to get admin token (you'll need to provide this)
const getAdminToken = () => {
  // You need to provide a valid admin token here
  // You can get this from the browser's localStorage after logging in as admin
  const token = process.env.ADMIN_TOKEN || '';
  
  if (!token) {
    console.error('❌ Admin token not provided. Please set ADMIN_TOKEN environment variable or modify this script.');
    console.log('💡 To get the token:');
    console.log('   1. Login to admin panel');
    console.log('   2. Open browser developer tools');
    console.log('   3. Go to Application/Storage tab');
    console.log('   4. Find localStorage and copy the adminToken value');
    console.log('   5. Set it as environment variable: set ADMIN_TOKEN=your_token_here');
    process.exit(1);
  }
  
  return token;
};

// Main function
const main = async () => {
  console.log('🚀 Starting pricing population script...');
  
  const adminToken = getAdminToken();
  await populatePricingViaAPI(adminToken);
  
  console.log('\n✅ Script completed!');
};

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { generateAllPricingData, populatePricingViaAPI };
