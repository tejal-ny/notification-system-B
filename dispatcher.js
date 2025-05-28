
/**
 * Notification Dispatcher Module
 * 
 * This module provides a dispatcher function that takes a notification object
 * and routes it to the appropriate notification service based on the type.
 */

// Import notification channels
const notifications = require('./notifications');

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
  
  try {
    // Log the dispatch attempt
    console.log(`[DISPATCHER] Sending ${normalizedType} notification to: ${recipient}`);
    
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
    
    // Re-throw with additional context
    throw new Error(`Failed to dispatch ${normalizedType} notification: ${error.message}`);
  }
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
  getSupportedTypes
};
