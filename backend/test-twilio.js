require('dotenv').config();
const { sendOTP } = require('./utils/notifications');

async function testTwilio() {
  console.log('🧪 Testing Twilio Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
  console.log(`TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
  console.log(`TWILIO_PHONE_NUMBER: ${process.env.TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ Missing'}`);
  
  if (process.env.TWILIO_PHONE_NUMBER) {
    console.log(`   Value: ${process.env.TWILIO_PHONE_NUMBER}`);
  }
  
  console.log('\n📱 Testing SMS Functionality...');
  
  try {
    // Test with a verified number
    const testPhone = '+919755620716';
    const testOTP = '123456';
    
    console.log(`\n🔍 Testing SMS to: ${testPhone}`);
    console.log(`📤 Sending OTP: ${testOTP}`);
    
    const result = await sendOTP(testPhone, testOTP);
    
    console.log('\n✅ SMS Test Result:');
    console.log(`Status: ${result.status}`);
    console.log(`SID: ${result.sid}`);
    console.log(`To: ${result.to}`);
    console.log(`Body: ${result.body}`);
    
    if (result.sid === 'dev_mode_simulated') {
      console.log('\n💡 Note: This is running in development mode (SMS not actually sent)');
      console.log('   To send real SMS, verify the phone number in Twilio console');
    }
    
  } catch (error) {
    console.error('\n❌ SMS Test Failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('Failed to send SMS')) {
      console.log('\n🔧 Troubleshooting Tips:');
      console.log('1. Check your .env file has correct Twilio credentials');
      console.log('2. Verify the phone number in Twilio console');
      console.log('3. Make sure your Twilio account is active');
      console.log('4. Check Twilio console for any error messages');
    }
  }
}

// Run the test
testTwilio().catch(console.error);
