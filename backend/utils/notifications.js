const smsIndiaHubService = require('../services/smsIndiaHubService');

/**
 * Send OTP via SMS using SMSIndia Hub
 * @param {string} phone - Phone number to send SMS to
 * @param {string} otp - OTP code to send
 * @returns {Promise<Object>} - Response object
 */
const sendOTP = async (phone, otp) => {
  try {
    console.log(`Attempting to send OTP ${otp} to phone: ${phone}`);
    
    const result = await smsIndiaHubService.sendOTP(phone, otp);
    
    console.log(`SMS sent successfully via SMSIndia Hub:`, result);
    return result;
    
  } catch (error) {
    console.error('Failed to send OTP via SMSIndia Hub:', error.message);
    
    // Re-throw the error to be handled by the calling function
    throw new Error(`SMS sending failed: ${error.message}`);
  }
};

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
    return await smsIndiaHubService.sendOTP(phone, message);
  } catch (error) {
    console.error('Error sending booking confirmation SMS:', error);
    throw error;
  }
};

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
    return await smsIndiaHubService.sendOTP(phone, message);
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
    return await smsIndiaHubService.sendOTP(phone, message);
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
    return await smsIndiaHubService.sendOTP(phone, message);
  } catch (error) {
    console.error('Error sending payment confirmation SMS:', error);
    throw error;
  }
};

/**
 * Get SMSIndia Hub account balance
 * @returns {Promise<Object>} - Balance information
 */
const getSMSBalance = async () => {
  try {
    return await smsIndiaHubService.getBalance();
  } catch (error) {
    console.error('Error fetching SMS balance:', error);
    throw error;
  }
};

/**
 * Get delivery status of a message
 * @param {string} messageId - Message ID to check
 * @returns {Promise<Object>} - Delivery status
 */
const getDeliveryStatus = async (messageId) => {
  try {
    return await smsIndiaHubService.getDeliveryStatus(messageId);
  } catch (error) {
    console.error('Error fetching delivery status:', error);
    throw error;
  }
};

/**
 * Test SMSIndia Hub connection
 * @returns {Promise<Object>} - Test result
 */
const testSMSConnection = async () => {
  try {
    return await smsIndiaHubService.testConnection();
  } catch (error) {
    console.error('Error testing SMS connection:', error);
    throw error;
  }
};

module.exports = {
  sendOTP,
  sendBookingConfirmationSMS,
  sendDriverAssignmentSMS,
  sendTripStatusSMS,
  sendPaymentConfirmationSMS,
  getSMSBalance,
  getDeliveryStatus,
  testSMSConnection
};