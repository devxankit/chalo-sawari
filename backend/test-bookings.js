const mongoose = require('mongoose');
const Booking = require('./models/Booking');

async function testBookings() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chalo-sawari');
    console.log('✅ Connected to MongoDB');
    
    // Check for bookings on August 30th
    const bookings = await Booking.find({
      'tripDetails.date': '2025-08-30',
      'status': { $in: ['pending', 'accepted', 'started'] }
    });
    
    console.log(`📅 Found ${bookings.length} bookings for August 30th, 2025`);
    
    if (bookings.length > 0) {
      console.log('📋 Bookings details:');
      bookings.forEach((booking, index) => {
        console.log(`${index + 1}. Vehicle: ${booking.vehicle}, Status: ${booking.status}, Date: ${booking.tripDetails.date}`);
      });
    }
    
    // Check for any bookings with status pending, accepted, or started
    const allActiveBookings = await Booking.find({
      'status': { $in: ['pending', 'accepted', 'started'] }
    });
    
    console.log(`\n📊 Total active bookings: ${allActiveBookings.length}`);
    
    if (allActiveBookings.length > 0) {
      console.log('📋 All active bookings:');
      allActiveBookings.forEach((booking, index) => {
        console.log(`${index + 1}. Vehicle: ${booking.vehicle}, Status: ${booking.status}, Date: ${booking.tripDetails.date}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

testBookings();
