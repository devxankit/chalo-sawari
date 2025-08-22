const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Driver = require('./models/Driver');

// Connect to database
mongoose.connect('mongodb://localhost:27017/chalo_sawari', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Check if we can connect
    await mongoose.connection.asPromise();
    console.log('✅ Database connected successfully');
    
    // Check if there are any drivers
    const drivers = await Driver.find().select('_id firstName lastName email');
    console.log(`📊 Found ${drivers.length} drivers in database`);
    
    if (drivers.length > 0) {
      console.log('Sample driver:', drivers[0]);
      
      // Check if there are any bookings for the first driver
      const driverId = drivers[0]._id;
      const bookings = await Booking.find({ driver: driverId }).select('_id createdAt status payment.status pricing.totalAmount');
      console.log(`📋 Found ${bookings.length} bookings for driver ${drivers[0].firstName}`);
      
      if (bookings.length > 0) {
        console.log('Sample booking:', {
          id: bookings[0]._id,
          createdAt: bookings[0].createdAt,
          status: bookings[0].status,
          paymentStatus: bookings[0].payment?.status,
          totalAmount: bookings[0].pricing?.totalAmount
        });
        
        // Check for paid bookings
        const paidBookings = bookings.filter(b => b.payment?.status === 'completed');
        console.log(`💰 Found ${paidBookings.length} paid bookings`);
        
        if (paidBookings.length > 0) {
          const totalEarnings = paidBookings.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
          console.log(`💵 Total earnings: ₹${totalEarnings}`);
        }
      }
    }
    
    // Check all bookings
    const allBookings = await Booking.find().select('_id driver createdAt status payment.status pricing.totalAmount');
    console.log(`📋 Total bookings in database: ${allBookings.length}`);
    
    if (allBookings.length > 0) {
      console.log('Sample booking from all:', {
        id: allBookings[0]._id,
        driver: allBookings[0].driver,
        createdAt: allBookings[0].createdAt,
        status: allBookings[0].status,
        paymentStatus: allBookings[0].payment?.status,
        totalAmount: allBookings[0].pricing?.totalAmount
      });
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testDatabase();
