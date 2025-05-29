/**
 * Error Handler Module
 * 
 * Provides centralized error handling for the notification system.
 * Standardizes error logging and error responses across all notification channels.
 */

// For future use with external logging services
const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
};

/**
 * Format the error message with consistent structure
 * 
 * @param {string} channel - The notification channel (email, sms, etc.)
 * @param {string} recipient - The notification recipient
 * @param {Error|string} error - The error object or error message
 * @param {Object} [additionalInfo={}] - Any additional context for the error
 * @returns {string} - Formatted error message
 */
function formatErrorMessage(channel, recipient, error, additionalInfo = {}) {
  const errorMsg = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : null;
  const timestamp = new Date().toISOString();
  
  // Build detailed context info
  const contextInfo = {
    timestamp,
    channel: channel?.toUpperCase() || 'UNKNOWN',
    recipient: recipient || 'UNKNOWN',
    ...additionalInfo
  };
  
  // Create a formatted context string
  const contextStr = Object.entries(contextInfo)
    .map(([key, value]) => `${key}=${value}`)
    .join(' | ');
  
  return `[ERROR] [${contextStr}] ${errorMsg}${errorStack ? `\n${errorStack}` : ''}`;
}

/**
 * Log an error with standard formatting
 * 
 * @param {string} channel - The notification channel (email, sms, etc.)
 * @param {string} recipient - The notification recipient
 * @param {Error|string} error - The error object or error message
 * @param {Object} [additionalInfo={}] - Any additional context for the error
 */
function logError(channel, recipient, error, additionalInfo = {}) {
  const formattedMessage = formatErrorMessage(channel, recipient, error, additionalInfo);
  
  // Log to console - In production, this could be replaced with a proper logging service
  console.error(formattedMessage);
  
  // Here you could add additional logging to external services
  // For example: logToExternalService(formattedMessage, LOG_LEVELS.ERROR);
}

/**
 * Wrap a function with try-catch and standardized error handling
 * 
 * @param {Function} fn - The function to wrap
 * @param {string} channel - The notification channel (email, sms, etc.)
 * @param {string} recipient - The notification recipient
 * @param {Object} [additionalInfo={}] - Any additional context for the error
 * @returns {Function} - Wrapped function with error handling
 */
function withErrorHandling(fn, channel, recipient, additionalInfo = {}) {
  return async function(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      // Log the error with all context
      logError(channel, recipient, error, {
        ...additionalInfo,
        arguments: JSON.stringify(args.map(arg => 
          typeof arg === 'object' ? 
          // Sanitize objects to prevent logging sensitive information
          (arg ? Object.keys(arg).join(',') : null) : 
          String(arg)
        ).filter(Boolean))
      });
      
      // Return a standardized error response object
      return {
        success: false,
        channel,
        recipient,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  };
}

/**
 * Safely execute a function and handle any errors
 * 
 * @param {Function} fn - The function to execute
 * @param {string} channel - The notification channel (email, sms, etc.)
 * @param {string} recipient - The notification recipient
 * @param {Array} args - Arguments to pass to the function
 * @param {Object} [additionalInfo={}] - Any additional context for the error
 * @returns {Promise<*>} - Result of the function or error object
 */
async function safeExecute(fn, channel, recipient, args = [], additionalInfo = {}) {
  try {
    return await fn(...args);
  } catch (error) {
    logError(channel, recipient, error, additionalInfo);
    
    // Return a standardized error response object
    return {
      success: false,
      channel,
      recipient,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date()
    };
  }
}

/**
 * Create an error response object with consistent structure
 * 
 * @param {string} channel - The notification channel (email, sms, etc.)
 * @param {string} recipient - The notification recipient
 * @param {Error|string} error - The error object or error message
 * @param {Object} [additionalInfo={}] - Any additional context to include
 * @returns {Object} - Standardized error response object
 */
function createErrorResponse(channel, recipient, error, additionalInfo = {}) {
  // Log the error
  logError(channel, recipient, error, additionalInfo);
  
  // Return a standardized error response object
  return {
    success: false,
    channel: channel || 'unknown',
    recipient: recipient || 'unknown',
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date(),
    ...additionalInfo
  };
}

module.exports = {
  LOG_LEVELS,
  logError,
  withErrorHandling,
  safeExecute,
  createErrorResponse,
  formatErrorMessage
};
