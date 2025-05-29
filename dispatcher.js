
/**
 * Notification Dispatcher Module
 * 
 * This module provides a dispatcher function that takes a notification object
 * and routes it to the appropriate notification service based on the type.
 */

// Import notification channels
const notifications = require('./notifications');



/**
 * Validate an email address format
 * 
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateEmail(email) {
  // Basic email format validation with regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate a phone number format
 * 
 * @param {string} phoneNumber - The phone number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validatePhoneNumber(phoneNumber) {
  // Check that phone number starts with + and contains 7-15 digits
  // This is a basic check that works for E.164 formatted numbers
  const phoneRegex = /^\+\d{7,15}$/;
  return phoneRegex.test(phoneNumber);
}

/**
 * Validate a notification based on its type
 * 
 * @param {string} type - The notification type
 * @param {string} recipient - The notification recipient
 * @returns {Object} - Validation result {isValid, errorMessage}
 */
function validateNotification(type, recipient) {
  // Default to valid if we don't have specific validation for a type
  let isValid = true;
  let errorMessage = null;
  
  switch (type) {
    case 'email':
      // Validate email address format
      if (!validateEmail(recipient)) {
        isValid = false;
        errorMessage = `Invalid email address format: '${recipient}'`;
      }
      break;
      
    case 'sms':
      // Validate phone number format
      if (!validatePhoneNumber(recipient)) {
        isValid = false;
        errorMessage = `Invalid phone number format: '${recipient}'. Must be in E.164 format (e.g., +12345678901)`;
      }
      break;
      
    case 'push':
      // Basic validation for push notification - just ensure recipient is not empty
      if (!recipient || recipient.trim() === '') {
        isValid = false;
        errorMessage = 'Device token/ID cannot be empty for push notifications';
      }
      break;
      
    default:
      // This shouldn't happen because we check supported types earlier,
      // but including for completeness
      isValid = false;
      errorMessage = `Unknown notification type: '${type}'`;
  }
  
  return { isValid, errorMessage };
}


/**
 * Dispatch a notification to the appropriate service
 * 
 * @param {Object} notification - The notification object
 * @param {string} notification.type - The type of notification (email, sms)
 * @param {string} notification.recipient - The recipient of the notification
 * @param {string} notification.message - The content of the notification
 * @param {Object} [notification.options={}] - Additional options for the notification
 * @returns {Promise<Object>} - Promise resolving to the result of the operation
 * @throws {Error} - If the notification type is not supported or required fields are missing
 */
async function dispatchNotification(notification) {
  // Validate the notification object
  if (!notification) {
    throw new Error('Notification object is required');
  }
  
  const { type, recipient, message, options = {} } = notification;
  
  // Validate required fields
  if (!type) {
    throw new Error('Notification type is required');
  }
  
  if (!recipient) {
    throw new Error('Notification recipient is required');
  }
  
  if (!message) {
    throw new Error('Notification message is required');
  }
  
  // Convert type to lowercase for case-insensitive comparison
  const normalizedType = type.toLowerCase();
  
  // Check if the notification type is supported
  if (!notifications[normalizedType]) {
    throw new Error(
      `Notification type '${type}' is not supported. ` +
      `Supported types are: ${Object.keys(notifications).join(', ')}`
    );
  }
  
 
  // Validate notification details based on type
  const validation = validateNotification(normalizedType, recipient);
  if (!validation.isValid) {
    // Log the validation error but don't throw - we'll skip this notification
    console.error(`[DISPATCHER] Validation error: ${validation.errorMessage}`);
    
    // Return a result indicating validation failure
    return {
      type: normalizedType,
      recipient,
      status: 'validation_failed',
      error: validation.errorMessage,
      timestamp: new Date(),
      dispatched: false
    };
  }
  
  try {
    // Log the dispatch attempt
    console.log(`[DISPATCHER] Sending ${normalizedType} notification to: ${recipient}`);
    
    // Validate message length based on notification type
    if (normalizedType === 'sms' && message.length > 160) {
      console.warn(`[DISPATCHER] SMS message exceeds 160 characters (${message.length}). May be sent as multiple messages.`);
    }
    
    // Dispatch to the appropriate notification service
    const result = await notifications[normalizedType].send(recipient, message, options);
    
    // Add dispatch metadata to the result
    return {
      ...result,
      dispatched: true,
      dispatchTimestamp: new Date()
    };
  } catch (error) {
    // Handle errors from notification services
    console.error(`[DISPATCHER] Error sending ${normalizedType} notification:`, error.message);
    
    // Return a result indicating dispatch failure (rather than throwing)
    return {
      type: normalizedType,
      recipient,
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''), // Truncate for logging
      status: 'dispatch_failed',
      error: error.message,
      timestamp: new Date(),
      dispatched: false
    };
  }

  // try {
  //   // Log the dispatch attempt
  //   console.log(`[DISPATCHER] Sending ${normalizedType} notification to: ${recipient}`);
    
  //   // Dispatch to the appropriate notification service
  //   const result = await notifications[normalizedType].send(recipient, message, options);
    
  //   // Add dispatch metadata to the result
  //   return {
  //     ...result,
  //     dispatched: true,
  //     dispatchTimestamp: new Date()
  //   };
  // } catch (error) {
  //   // Handle errors from notification services
  //   console.error(`[DISPATCHER] Error sending ${normalizedType} notification:`, error.message);
    
  //   // Re-throw with additional context
  //   throw new Error(`Failed to dispatch ${normalizedType} notification: ${error.message}`);
  // }
}

/**
 * Utility function to check if a notification type is supported
 * 
 * @param {string} type - The notification type to check
 * @returns {boolean} - True if supported, false otherwise
 */
function isTypeSupported(type) {
  if (!type) return false;
  return Object.keys(notifications).includes(type.toLowerCase());
}

/**
 * Get a list of all supported notification types
 * 
 * @returns {string[]} - Array of supported notification types
 */
function getSupportedTypes() {
  return Object.keys(notifications);
}

module.exports = {
  dispatchNotification,
  isTypeSupported,
  getSupportedTypes,
  // Export validation functions for testing
  validateEmail,
  validatePhoneNumber,
  validateNotification
};