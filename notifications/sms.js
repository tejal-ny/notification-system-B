/**
 * SMS notification module
 * 
 * This module provides functionality to send SMS notifications
 * using Twilio or a mock implementation
 */

const config = require('../config');
const { validatePhoneNumber } = require('./validators');
const twilio = require('twilio');
const errorHandler = require('../error-handler');

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

/**
 * Initialize Twilio client with credentials from environment variables
 * 
 * @returns {Object} - Object containing client and error if any
 */
function getTwilioClient() {
  // Validate environment variables before trying to use them
  const validation = validateEnvVariables();
  
  if (!validation.success) {
    return { client: null, error: validation.error };
  }
  
  try {
    // Dynamically require Twilio to prevent errors if env vars are not set
    const twilio = require('twilio');
    
    // Create and return the Twilio client with credentials from environment variables
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    return { client, error: null };
  } catch (error) {
    return { 
      client: null, 
      error: `Failed to initialize Twilio client: ${error.message}` 
    };
  }
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

  // try {
  //   // Send SMS using Twilio
  //   const result = await twilioClient.messages.create({
  //     body: message,
  //     from: fromNumber,
  //     to: formattedNumber
  //   });
    
  //   return {
  //     success: true,
  //     sid: result.sid,
  //     status: result.status
  //   };
  // } catch (error) {
  //   console.error('Failed to send SMS:', error.message);
  //   const smsError = new Error(`Failed to send SMS: ${error.message}`);
  //   smsError.code = 'SMS_SEND_ERROR';
  //   smsError.originalError = error;
  //   throw smsError;
  // }
}
/**
 * Internal implementation of SMS sending functionality
 * 
 * @param {string} recipient - Phone number of the recipient in E.164 format
 * @param {string} message - The message to be sent
 * @param {Object} options - Additional options for the SMS
 * @returns {Promise<Object>} - Promise resolving to the result of the operation
 * @throws {Error} - If something goes wrong during sending
 */
async function _sendSms(recipient, message, options = {}) {
  // Get the Twilio client
  const { client, error } = getTwilioClient();
  
  if (error) {
    throw new Error(error);
  }
  
  if (!client) {
    throw new Error('SMS client initialization failed');
  }
  
  // If we get here, we have a valid client
  // Simulating potential errors that might occur
  if (Math.random() < 0.1) {  // 10% chance of random error for demo purposes
    throw new Error('Simulated SMS delivery failure');
  }
  
  // Send the SMS using Twilio
  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: recipient,
    ...options  // Allow passing additional Twilio options
  });
  
  // Return a sanitized response
  return {
    channel: 'sms',
    provider: 'twilio',
    recipient,
    messageId: result.sid,
    timestamp: new Date(),
    status: result.status,
    success: true
  };
}

/**
 * Send an SMS notification using Twilio with error handling
 * 
 * @param {string} recipient - Phone number of the recipient in E.164 format
 * @param {string} message - The message to be sent
 * @param {Object} options - Additional options for the SMS
 * @returns {Promise<Object>} - Promise resolving to the result of the operation
 */
async function send(recipient, message, options = {}) {
  // Additional context information for logging
  const contextInfo = {
    messageLength: message ? message.length : 0,
    hasOptions: options && Object.keys(options).length > 0,
    timestamp: new Date().toISOString(),
    fromNumber: process.env.TWILIO_PHONE_NUMBER || 'unknown'
  };
  
  try {
    // Log the attempt (without exposing full message content)
    console.log(`[INFO] [channel=SMS] [recipient=${recipient}] Sending SMS of length ${contextInfo.messageLength}`);
    
    // Send the SMS
    const result = await _sendSms(recipient, message, options);
    
    // Return the successful result
    return {
      ...result,
      success: true
    };
  } catch (error) {
    // Use the error handler to log the error with all context
    // But make sure to sanitize the message to avoid logging sensitive content
    return errorHandler.createErrorResponse(
      'sms',
      recipient,
      error,
      {
        ...contextInfo,
        messagePreview: message ? message.substring(0, 20) + '...' : null
      }
    );
  }
}

// Create a wrapped version that includes error handling directly
const sendWithErrorHandling = errorHandler.withErrorHandling(
  _sendSms,
  'sms',
  null,  // recipient will be provided when called
  { provider: 'twilio', source: 'sms_module' }
);
module.exports = {
  sendSms,
  send,
  sendWithErrorHandling,
  validateEnvVars
};