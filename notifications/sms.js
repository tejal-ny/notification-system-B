/**
 * SMS notification module
 * 
 * This module provides functionality to send SMS notifications
 * using Twilio or a mock implementation
 */

const config = require('../config');
const { validatePhoneNumber } = require('./validators');
const twilio = require('twilio');


// Load environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const senderNumber = process.env.TWILIO_PHONE_NUMBER;

// Validate that all required environment variables are set
const validateEnvVars = () => {
  const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please ensure these are set in your .env file or environment.'
    );
  }
  return true;
};
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
      console.log(`From: ${process.env.TWILIO_FROM_NUMBER}`);
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
  const fromNumber = options.from || process.env.TWILIO_FROM_NUMBER;
  
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
    // Validate environment variables first
    validateEnvVars();
    
    // Initialize the client with credentials from environment variables
    const client = twilio(accountSid, authToken);
    
    // Send the SMS
    const result = await client.messages.create({
      body: message,
      from: senderNumber,
      to: to
    });
    
    console.log(`SMS sent successfully! SID: ${result.sid}`);
    return result;
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    throw error;
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