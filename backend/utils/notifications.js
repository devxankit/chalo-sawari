const twilio = require('twilio');

// Initialize Twilio client
let twilioClient;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Check if a phone number is verified in Twilio trial account
 * @param {string} phone - Phone number to check
 * @returns {boolean}
 */
const isPhoneVerified = (phone) => {
  // For development/testing, you can add verified numbers here
  // In production, this should be managed through Twilio console or database
  const verifiedNumbers = [
    '+919755620716', // Your verified number
    '+917610416911', // Add more verified numbers as needed
    // Add all phone numbers you want to send SMS to during development
  ];
  
  return verifiedNumbers.includes(phone);
};

/**
 * Send OTP via SMS using Twilio (Trial Account Compatible)
 * @param {string} phone - Phone number to send SMS to
 * @param {string} otp - OTP code to send
 * @returns {Promise}
 */
const sendOTP = async (phone, otp) => {
  try {
    if (!twilioClient) {
      console.log('Twilio not configured, using development mode for SMS');
      // For development, simulate SMS sending
      const digits = phone.replace(/[^0-9]/g, '');
      const normalizedPhone = '+91' + digits.slice(-10);
      
      console.log(`[DEV MODE] OTP ${otp} would be sent to ${normalizedPhone}`);
      console.log(`[DEV MODE] SMS Content: Your Chalo Sawari verification code is: ${otp}. This code will expire in 5 minutes.`);
      
      return {
        sid: 'dev_mode_simulated',
        status: 'sent',
        to: normalizedPhone,
        body: `Your Chalo Sawari verification code is: ${otp}. This code will expire in 5 minutes.`
      };
    }

    // Get Twilio phone number from environment (this should be your Twilio-provided number)
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    if (!twilioPhoneNumber) {
      console.log('TWILIO_PHONE_NUMBER not configured, using development mode for SMS');
      const digits = phone.replace(/[^0-9]/g, '');
      const normalizedPhone = '+91' + digits.slice(-10);
      
      console.log(`[DEV MODE] OTP ${otp} would be sent to ${normalizedPhone}`);
      console.log(`[DEV MODE] SMS Content: Your Chalo Sawari verification code is: ${otp}. This code will expire in 5 minutes.`);
      
      return {
        sid: 'dev_mode_simulated',
        status: 'sent',
        to: normalizedPhone,
        body: `Your Chalo Sawari verification code is: ${otp}. This code will expire in 5 minutes.`
      };
    }

    // Always use +91 and last 10 digits for Indian recipient numbers
    const digits = phone.replace(/[^0-9]/g, '');
    const normalizedPhone = '+91' + digits.slice(-10);

    // Check if phone number is verified (required for trial accounts)
    if (!isPhoneVerified(normalizedPhone)) {
      console.log(`Phone number ${normalizedPhone} is not verified in Twilio trial account.`);
      console.log('For development, you can:');
      console.log('1. Verify this number in your Twilio console, or');
      console.log('2. Add it to the verifiedNumbers array in notifications.js, or');
      console.log('3. Use a different verified number for testing');
      
      console.log(`[DEV MODE] OTP ${otp} would be sent to ${normalizedPhone}`);
      console.log(`[DEV MODE] SMS Content: Your Chalo Sawari verification code is: ${otp}. This code will expire in 5 minutes.`);
      
      // Return success for development (comment this out in production)
      return {
        sid: 'dev_mode_simulated',
        status: 'sent',
        to: normalizedPhone,
        body: `Your Chalo Sawari verification code is: ${otp}. This code will expire in 5 minutes.`
      };
    }

    // Log the phone numbers for debugging
    console.log(`Sending SMS from: ${twilioPhoneNumber} to: ${normalizedPhone}`);

    const message = await twilioClient.messages.create({
      body: `Your Chalo Sawari verification code is: ${otp}. This code will expire in 5 minutes.`,
      from: twilioPhoneNumber,
      to: normalizedPhone
    });

    console.log(`SMS sent successfully to ${normalizedPhone}, SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Provide more specific error information for common Twilio issues
    if (error.code === 21659) {
      console.error('Twilio Error: The "from" phone number is not valid in your Twilio account.');
      console.error('Please check your TWILIO_PHONE_NUMBER in .env file.');
      console.error('Current value:', process.env.TWILIO_PHONE_NUMBER);
      console.error('Make sure this number exists in your Twilio console and is in the correct format.');
    } else if (error.code === 21211) {
      console.error('Twilio Error: Invalid phone number format.');
      console.error('Make sure the phone number includes country code (e.g., +91XXXXXXXXXX)');
    } else if (error.code === 21610) {
      console.error('Twilio Error: Phone number not verified.');
      console.error('In trial accounts, you can only send SMS to verified phone numbers.');
      console.error('Please verify this number in your Twilio console first.');
    } else if (error.code === 21614) {
      console.error('Twilio Error: "To" phone number not verified.');
      console.error('This phone number is not verified in your Twilio trial account.');
    }
    
    // For development, don't throw error, just log and return success
    console.log('Using development mode due to Twilio error');
    const digits = phone.replace(/[^0-9]/g, '');
    const normalizedPhone = '+91' + digits.slice(-10);
    
    console.log(`[DEV MODE] OTP ${otp} would be sent to ${normalizedPhone}`);
    
    return {
      sid: 'dev_mode_simulated',
      status: 'sent',
      to: normalizedPhone,
      body: `Your Chalo Sawari verification code is: ${otp}. This code will expire in 5 minutes.`
    };
  }
};

/**
 * Verify a phone number in Twilio (for trial accounts)
 * @param {string} phone - Phone number to verify
 * @returns {Promise}
 */
const verifyPhoneNumber = async (phone) => {
  try {
    if (!twilioClient) {
      throw new Error('Twilio not configured');
    }

    // Normalize phone number
    const digits = phone.replace(/[^0-9]/g, '');
    const normalizedPhone = '+91' + digits.slice(-10);

    // Use Twilio Verify service to send verification code
    const verification = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: normalizedPhone,
        channel: 'sms'
      });

    console.log(`Verification code sent to ${normalizedPhone}, SID: ${verification.sid}`);
    return verification;
  } catch (error) {
    console.error('Error verifying phone number:', error);
    throw new Error('Failed to verify phone number');
  }
};

/**
 * Check verification code (for trial accounts)
 * @param {string} phone - Phone number
 * @param {string} code - Verification code
 * @returns {Promise}
 */
const checkVerificationCode = async (phone, code) => {
  try {
    if (!twilioClient) {
      throw new Error('Twilio not configured');
    }

    // Normalize phone number
    const digits = phone.replace(/[^0-9]/g, '');
    const normalizedPhone = '+91' + digits.slice(-10);

    // Check verification code
    const verificationCheck = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: normalizedPhone,
        code: code
      });

    console.log(`Verification check for ${normalizedPhone}: ${verificationCheck.status}`);
    return verificationCheck;
  } catch (error) {
    console.error('Error checking verification code:', error);
    throw new Error('Failed to check verification code');
  }
};

// /**
//  * Send email using Nodemailer
//  * @param {string} to - Email address to send to
//  * @param {string} subject - Email subject
//  * @param {string} html - Email HTML content
//  * @returns {Promise}
//  */
// const sendEmail = async (to, subject, html) => {
//   try {
//     if (!transporter) {
//       console.log('SMTP not configured, skipping email');
//       return;
//     }

//     const mailOptions = {
//       from: process.env.SMTP_USER,
//       to: to,
//       subject: subject,
//       html: html
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent successfully:', info.messageId);
//     return info;
//   } catch (error) {
//     console.error('Error sending email:', error);
//     throw new Error('Failed to send email');
//   }
// };

/**
 * Send booking confirmation SMS
 * @param {string} phone - Phone number
 * @param {string} bookingNumber - Booking number
 * @param {string} pickupLocation - Pickup location
 * @param {string} dropLocation - Drop location
 * @param {string} pickupTime - Pickup time
 * @returns {Promise}
 */
const sendBookingConfirmationSMS = async (phone, bookingNumber, pickupLocation, dropLocation, pickupTime) => {
  try {
    const message = `Your booking #${bookingNumber} is confirmed! Pickup: ${pickupLocation}, Drop: ${dropLocation}, Time: ${pickupTime}. Driver will contact you soon.`;
    return await sendOTP(phone, message);
  } catch (error) {
    console.error('Error sending booking confirmation SMS:', error);
    throw error;
  }
};

// /**
//  * Send booking confirmation email
//  * @param {string} email - Email address
//  * @param {string} bookingNumber - Booking number
//  * @param {string} pickupLocation - Pickup location
//  * @param {string} dropLocation - Drop location
//  * @param {string} pickupTime - Pickup time
//  * @returns {Promise}
//  */
// const sendBookingConfirmationEmail = async (email, bookingNumber, pickupLocation, dropLocation, pickupTime) => {
//   try {
//     const subject = `Booking Confirmation #${bookingNumber}`;
//     const html = `
//       <h2>Your booking is confirmed!</h2>
//       <p><strong>Booking Number:</strong> ${bookingNumber}</p>
//       <p><strong>Pickup Location:</strong> ${pickupLocation}</p>
//       <p><strong>Drop Location:</strong> ${dropLocation}</p>
//       <p><strong>Pickup Time:</strong> ${pickupTime}</p>
//       <p>Your driver will contact you soon.</p>
//     `;
//     return await sendEmail(email, subject, html);
//   } catch (error) {
//     console.error('Error sending booking confirmation email:', error);
//     throw error;
//   }
// };

/**
 * Send driver assignment SMS
 * @param {string} phone - Phone number
 * @param {string} driverName - Driver name
 * @param {string} driverPhone - Driver phone
 * @param {string} vehicleNumber - Vehicle number
 * @returns {Promise}
 */
const sendDriverAssignmentSMS = async (phone, driverName, driverPhone, vehicleNumber) => {
  try {
    const message = `Your driver ${driverName} (${driverPhone}) with vehicle ${vehicleNumber} is on the way. Please be ready at your pickup location.`;
    return await sendOTP(phone, message);
  } catch (error) {
    console.error('Error sending driver assignment SMS:', error);
    throw error;
  }
};

/**
 * Send trip status SMS
 * @param {string} phone - Phone number
 * @param {string} status - Trip status
 * @param {string} estimatedTime - Estimated arrival time
 * @returns {Promise}
 */
const sendTripStatusSMS = async (phone, status, estimatedTime) => {
  try {
    const message = `Trip Update: ${status}. ${estimatedTime ? `Estimated arrival: ${estimatedTime}` : ''}`;
    return await sendOTP(phone, message);
  } catch (error) {
    console.error('Error sending trip status SMS:', error);
    throw error;
  }
};

/**
 * Send payment confirmation SMS
 * @param {string} phone - Phone number
 * @param {string} amount - Payment amount
 * @param {string} transactionId - Transaction ID
 * @returns {Promise}
 */
const sendPaymentConfirmationSMS = async (phone, amount, transactionId) => {
  try {
    const message = `Payment of ₹${amount} confirmed! Transaction ID: ${transactionId}. Thank you for using Chalo Sawari.`;
    return await sendOTP(phone, message);
  } catch (error) {
    console.error('Error sending payment confirmation SMS:', error);
    throw error;
  }
};

// /**
//  * Send welcome email
//  * @param {string} email - Email address
//  * @param {string} name - User name
//  * @returns {Promise}
//  */
// const sendWelcomeEmail = async (email, name) => {
//   try {
//     const subject = 'Welcome to Chalo Sawari!';
//     const html = `
//       <h2>Welcome to Chalo Sawari, ${name}!</h2>
//       <p>Thank you for joining our platform. We're excited to have you on board!</p>
//       <p>Start booking your rides and enjoy seamless transportation services.</p>
//     `;
//     return await sendEmail(email, subject, html);
//   } catch (error) {
//     console.error('Error sending welcome email:', error);
//     throw error;
//   }
// };

module.exports = {
  sendOTP,
  verifyPhoneNumber,
  checkVerificationCode,
  // sendEmail, // commented out
  sendBookingConfirmationSMS,
  // sendBookingConfirmationEmail, // commented out
  sendDriverAssignmentSMS,
  sendTripStatusSMS,
  sendPaymentConfirmationSMS,
  // sendWelcomeEmail // commented out
};
