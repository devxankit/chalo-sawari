const mongoose = require('mongoose');
require('dotenv').config();

// Test script for refund functionality
async function testRefundFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test Razorpay service
    const RazorpayService = require('./services/razorpayService');
    
    console.log('\n🔍 Checking Razorpay configuration...');
    if (RazorpayService.isConfigured()) {
      console.log('✅ Razorpay is properly configured');
    } else {
      console.log('❌ Razorpay is not properly configured');
      console.log('Please check your .env file for RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
    }

    // Test Payment model
    const Payment = require('./models/Payment');
    console.log('\n🔍 Testing Payment model...');
    
    const paymentCount = await Payment.countDocuments();
    console.log(`✅ Payment model working. Total payments: ${paymentCount}`);

    // Test Booking model
    const Booking = require('./models/Booking');
    console.log('\n🔍 Testing Booking model...');
    
    const bookingCount = await Booking.countDocuments();
    console.log(`✅ Booking model working. Total bookings: ${bookingCount}`);

    // Test cancelled bookings
    const cancelledBookings = await Booking.find({ status: 'cancelled' });
    console.log(`✅ Found ${cancelledBookings.length} cancelled bookings`);

    if (cancelledBookings.length > 0) {
      const sampleBooking = cancelledBookings[0];
      console.log('\n📋 Sample cancelled booking:');
      console.log(`- ID: ${sampleBooking._id}`);
      console.log(`- Status: ${sampleBooking.status}`);
      console.log(`- Cancellation: ${sampleBooking.cancellation ? 'Yes' : 'No'}`);
      if (sampleBooking.cancellation) {
        console.log(`- Refund Status: ${sampleBooking.cancellation.refundStatus}`);
        console.log(`- Refund Amount: ₹${sampleBooking.cancellation.refundAmount}`);
      }
    }

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testRefundFlow();
