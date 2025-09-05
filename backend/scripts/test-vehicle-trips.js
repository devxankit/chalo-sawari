const mongoose = require('mongoose');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chalo-sawari', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const createTestData = async () => {
  try {
    console.log('🚀 Creating test data for vehicle trips...');
    
    // Connect to database
    await connectDB();
    
    // Find or create a test user
    let testUser = await User.findOne({ phone: '9589579906' });
    if (!testUser) {
      testUser = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com',
        phone: '9589579906',
        password: 'testpassword123',
        gender: 'prefer-not-to-say',
        isActive: true,
        isVerified: true,
        isTestUser: true,
        defaultOTP: '139913'
      });
      await testUser.save();
      console.log('✅ Test user created');
    }
    
    // Find or create a test driver
    let testDriver = await Driver.findOne({ phone: '9876543210' });
    if (!testDriver) {
      testDriver = new Driver({
        firstName: 'Test',
        lastName: 'Driver',
        email: 'driver@test.com',
        phone: '9876543210',
        password: 'testpassword123',
        gender: 'male',
        isActive: true,
        isVerified: true,
        isOnline: true,
        address: {
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India'
        }
      });
      await testDriver.save();
      console.log('✅ Test driver created');
    }
    
    // Find or create a test vehicle
    let testVehicle = await Vehicle.findOne({ registrationNumber: 'TEST123' });
    if (!testVehicle) {
      testVehicle = new Vehicle({
        driver: testDriver._id,
        type: 'bus',
        brand: 'Tata Motors',
        model: 'Test Bus',
        year: 2020,
        color: 'Blue',
        registrationNumber: 'TEST123',
        seatingCapacity: 50,
        fuelType: 'diesel',
        transmission: 'manual',
        isAvailable: true,
        isActive: true,
        isVerified: true,
        approvalStatus: 'approved',
        bookingStatus: 'available',
        vehicleLocation: {
          address: 'Test Location',
          coordinates: [77.2090, 28.6139],
          city: 'Delhi',
          state: 'Delhi',
          lastUpdated: new Date()
        },
        statistics: {
          totalTrips: 0,
          totalDistance: 0,
          totalEarnings: 0,
          averageRating: 0
        }
      });
      await testVehicle.save();
      console.log('✅ Test vehicle created');
    }
    
    // Create some test bookings
    const existingBookings = await Booking.find({ vehicle: testVehicle._id });
    console.log(`📊 Found ${existingBookings.length} existing bookings for test vehicle`);
    
    if (existingBookings.length < 3) {
      // Create 3 test bookings
      for (let i = 1; i <= 3; i++) {
        const booking = new Booking({
          user: testUser._id,
          driver: testDriver._id,
          vehicle: testVehicle._id,
          tripDetails: {
            pickup: {
              latitude: 28.6139,
              longitude: 77.2090,
              address: `Test Pickup ${i}`
            },
            destination: {
              latitude: 28.6140 + (i * 0.001),
              longitude: 77.2091 + (i * 0.001),
              address: `Test Destination ${i}`
            },
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '10:00',
            distance: 10 + (i * 5),
            duration: 30 + (i * 10),
            passengers: 1
          },
          pricing: {
            basePrice: 100,
            distancePrice: (10 + (i * 5)) * 5,
            totalAmount: 100 + ((10 + (i * 5)) * 5)
          },
          status: 'completed',
          trip: {
            startTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
            endTime: new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + (30 + (i * 10)) * 60 * 1000),
            actualDistance: 10 + (i * 5),
            actualDuration: 30 + (i * 10),
            actualFare: 100 + ((10 + (i * 5)) * 5)
          }
        });
        
        await booking.save();
        console.log(`✅ Test booking ${i} created`);
        
        // Update vehicle statistics
        await testVehicle.updateStatistics(booking.trip.actualDistance, booking.trip.actualFare);
        console.log(`📊 Updated vehicle statistics for booking ${i}`);
      }
    }
    
    // Check final statistics
    const finalVehicle = await Vehicle.findById(testVehicle._id);
    console.log('\n📊 Final Vehicle Statistics:');
    console.log(`   Total Trips: ${finalVehicle.statistics.totalTrips}`);
    console.log(`   Total Distance: ${finalVehicle.statistics.totalDistance} km`);
    console.log(`   Total Earnings: ₹${finalVehicle.statistics.totalEarnings}`);
    
    // Check bookings count
    const bookingsCount = await Booking.countDocuments({ vehicle: testVehicle._id });
    console.log(`   Bookings in DB: ${bookingsCount}`);
    
    console.log('\n✅ Test data creation completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
};

createTestData();
