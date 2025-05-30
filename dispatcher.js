

/**
 * Notification Dispatcher Module
 * 
 * This module provides a dispatcher function that takes a notification object
 * and routes it to the appropriate notification service based on the type.
 */

// Import notification channels
const notifications = require('./notifications');

const errorHandler = require('./error-handler');

const logger = require('./logger');
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
    const error = 'Notification object is required';
    return errorHandler.createErrorResponse('dispatcher', null, error);
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

   
  // Truncate message for logging to avoid very large logs
  const truncatedMessage = message 
    ? (message.length > 20 ? `${message.substring(0, 20)}...` : message) 
    : null;
  
  // Convert type to lowercase for case-insensitive comparison
const normalizedType = type ? type.toLowerCase() : null;
  
  // Additional context for error logging
  const contextInfo = {
    notificationType: normalizedType,
    messageLength: message ? message.length : 0,
    hasOptions: options && Object.keys(options).length > 0
  };

  // Check if the notification type is supported
  if (!notifications[normalizedType]) {
    throw new Error(
      `Notification type '${type}' is not supported. ` +
      `Supported types are: ${Object.keys(notifications).join(', ')}`
    );
  }
  
 
  // Validate notification details based on type
   // Validate notification based on its type
  const validationResult = validateNotification(notification);
  
  if (!validationResult.isValid) {
    // Use error handler to log validation error with context
    return errorHandler.createErrorResponse(
      normalizedType || 'unknown', 
      recipient, 
      validationResult.error,
      {
        ...contextInfo,
        error: 'validation_failed',
        messagePreview: truncatedMessage,
        dispatched: false,
        dispatchTimestamp: new Date()
      }
    );
  }
  
  // Check if the notification type is supported
  if (!notifications[normalizedType]) {
    const error = `Notification type '${type}' is not supported. Supported types are: ${Object.keys(notifications).join(', ')}`;
    
    return errorHandler.createErrorResponse(
      'dispatcher', 
      recipient, 
      error,
      {
        ...contextInfo,
        error: 'unsupported_type',
        messagePreview: truncatedMessage,
        dispatched: false,
        dispatchTimestamp: new Date()
      }
    );
  }
  
  try {
    // Log the dispatch attempt (info level)
    console.log(`[INFO] [channel=${normalizedType}] [recipient=${recipient}] Sending notification`);
    
    // Dispatch to the appropriate notification service with error handling
    const sendFunction = notifications[normalizedType].send;
    
    // Use safe execute to catch any errors during sending
    const result = await errorHandler.safeExecute(
      sendFunction, 
      normalizedType,
      recipient, 
      [recipient, message, options],
      contextInfo
    );
    
    // Check if the result is an error response from safeExecute
    if (result && result.success === false) {
      // The error was already logged by safeExecute
      return {
        ...result,
        type: normalizedType,
        messagePreview: truncatedMessage,
        dispatched: false,
        dispatchTimestamp: new Date()
      };
    }
    
    // If we got here, the notification was sent successfully
    return {
      ...result,
      success: true,
      dispatched: true,
      dispatchTimestamp: new Date()
    };
  } catch (error) {
    // This catch should rarely be triggered since safeExecute handles errors,
    // but it's here as a failsafe for unexpected issues
    return errorHandler.createErrorResponse(
      normalizedType,
      recipient,
      `Unexpected error in dispatch: ${error.message}`,
      {
        ...contextInfo,
        messagePreview: truncatedMessage,
        dispatched: false,
        dispatchTimestamp: new Date()
      }
    );
  }
  // const validation = validateNotification(normalizedType, recipient);
  // if (!validation.isValid) {
  //   // Log the validation error but don't throw - we'll skip this notification
  //   console.error(`[DISPATCHER] Validation error: ${validation.errorMessage}`);
    
  //   // Return a result indicating validation failure
  //   return {
  //     type: normalizedType,
  //     recipient,
  //     status: 'validation_failed',
  //     error: validation.errorMessage,
  //     timestamp: new Date(),
  //     dispatched: false
  //   };
  // }
  
  // try {
  //   // Log the dispatch attempt
  //   console.log(`[DISPATCHER] Sending ${normalizedType} notification to: ${recipient}`);
    
  //   // Validate message length based on notification type
  //   if (normalizedType === 'sms' && message.length > 160) {
  //     console.warn(`[DISPATCHER] SMS message exceeds 160 characters (${message.length}). May be sent as multiple messages.`);
  //   }
    
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
    
  //   // Return a result indicating dispatch failure (rather than throwing)
  //   return {
  //     type: normalizedType,
  //     recipient,
  //     message: message.substring(0, 50) + (message.length > 50 ? '...' : ''), // Truncate for logging
  //     status: 'dispatch_failed',
  //     error: error.message,
  //     timestamp: new Date(),
  //     dispatched: false
  //   };
  // }

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

async function sendNotificationsToTargetedUsers(message, options = {}) {
  // Ensure preferences are loaded
  if (!userPreferences.loaded) {
    await userPreferences.load();
  }
  
  const results = {
    email: { sent: 0, skipped: 0 },
    sms: { sent: 0, skipped: 0 },
    errors: []
  };
  
  // Get all user preferences
  const users = userPreferences.getAllPreferences();
  
  // Send notifications based on user preferences
  for (const user of users) {
    // Send email if enabled
    if (user.emailEnabled) {
      try {
        const emailResult = await notifier.sendEmail(
          user.userId, 
          message,
          options.emailOptions || {}
        );
        
        if (emailResult.dispatched) {
          results.email.sent++;
        } else {
          results.email.skipped++;
          results.errors.push({
            userId: user.userId,
            type: 'email',
            error: emailResult.error
          });
        }
      } catch (error) {
        results.email.skipped++;
        results.errors.push({
          userId: user.userId,
          type: 'email',
          error: error.message
        });
      }
    } else {
      results.email.skipped++;
    }
    
    // Send SMS if enabled and phone number exists
    if (user.smsEnabled && user.phoneNumber) {
      try {
        const smsResult = await notifier.sendSMS(
          user.phoneNumber,
          message,
          options.smsOptions || {}
        );
        
        if (smsResult.dispatched) {
          results.sms.sent++;
        } else {
          results.sms.skipped++;
          results.errors.push({
            userId: user.userId,
            type: 'sms',
            error: smsResult.error
          });
        }
      } catch (error) {
        results.sms.skipped++;
        results.errors.push({
          userId: user.userId,
          type: 'sms',
          error: error.message
        });
      }
    } else {
      results.sms.skipped++;
    }
  }
  
  return results;
}

module.exports = {
  dispatchNotification,
  isTypeSupported,
  getSupportedTypes,
  validateNotification,
  validateEmail,
  validatePhoneNumber,
  // getErrorLog,
  // clearErrorLog,
  getNotificationLog: logger.getNotificationLog,
  clearNotificationLog: logger.clearNotificationLog,
  sendNotificationsToTargetedUsers
};