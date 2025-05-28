/**
 * SMS notification module
 * 
 * This module provides functionality to send SMS notifications
 * using Twilio or a mock implementation
 */

const config = require('../config');
const { validatePhoneNumber } = require('./validators');

// Initialize Twilio client if credentials are available
let twilioClient;
function initTwilioClient() {
  if (config.sms.accountSid && config.sms.authToken) {
    const twilio = require('twilio');
    return twilio(config.sms.accountSid, config.sms.authToken);
  }
  return null;
}

/**
 * Mock SMS sender for development/testing
 * 
 * @param {string} to - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise} - Resolves with mock send result
 */
function sendSmsMock(to, message) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      console.log('-------------------------');
      console.log('📱 MOCK SMS SENT:');
      console.log(`To: ${to}`);
      console.log(`From: ${config.sms.fromNumber}`);
      console.log('-------------------------');
      console.log(message);
      console.log('-------------------------');
      resolve({ 
        success: true, 
        sid: `mock-sms-${Date.now()}`,
        status: 'sent'
      });
    }, 300);
  });
}

/**
 * Sends an SMS notification using Twilio or mock implementation
 * 
 * @param {string} to - Recipient phone number
 * @param {string} message - SMS message content
 * @param {Object} options - Additional SMS options
 * @returns {Promise} - Resolves with send result or rejects with error
 */
async function sendSms(to, message, options = {}) {
  // Validate phone number
  const validation = validatePhoneNumber(to);
  
  if (!validation.isValid) {
    const error = new Error(`Invalid phone number: ${to}`);
    error.code = 'INVALID_PHONE';
    error.details = validation.error;
    console.error('SMS validation failed:', error.message);
    return Promise.reject(error);
  }

  const formattedNumber = validation.formattedNumber || to;
  const fromNumber = options.from || config.sms.fromNumber;
  
  // Use mock implementation in development or mock mode
  if (process.env.SMS_MODE === 'mock' || config.isDev) {
    return sendSmsMock(formattedNumber, message);
  }
  
  // Initialize Twilio client if not already done
  if (!twilioClient) {
    twilioClient = initTwilioClient();
    
    if (!twilioClient) {
      const error = new Error('SMS service not configured properly');
      error.code = 'SMS_CONFIG_ERROR';
      console.error('SMS configuration error:', error.message);
      return Promise.reject(error);
    }
  }
  
  try {
    // Send SMS using Twilio
    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: formattedNumber
    });
    
    return {
      success: true,
      sid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Failed to send SMS:', error.message);
    const smsError = new Error(`Failed to send SMS: ${error.message}`);
    smsError.code = 'SMS_SEND_ERROR';
    smsError.originalError = error;
    throw smsError;
  }
}

module.exports = {
  sendSms
};