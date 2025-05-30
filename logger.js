/**
 * Notification Logger Module
 * 
 * Provides centralized logging functionality for all outgoing notifications.
 * Logs to both console and file with configurable formats.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const colors = require('colors/safe');

// Configure logging
const LOG_DIRECTORY = process.env.LOG_DIRECTORY || 'logs';
const NOTIFICATION_LOG_FILE = path.join(LOG_DIRECTORY, 'notifications.log');
const MAX_MESSAGE_PREVIEW_LENGTH = 50;
const LOG_TO_FILE = process.env.LOG_TO_FILE !== 'false';
const LOG_TO_CONSOLE = process.env.LOG_TO_CONSOLE !== 'false';
const ENABLE_COLORS = process.env.ENABLE_COLORS !== 'false';

// Set up colors
colors.setTheme({
  email: 'cyan',
  sms: 'magenta',
  push: 'blue',
  success: 'green',
  error: 'red',
  simulated: 'yellow',
  timestamp: 'grey',
  recipient: 'white',
  message: 'white'
});

// Create log directory if it doesn't exist
try {
  if (!fs.existsSync(LOG_DIRECTORY)) {
    fs.mkdirSync(LOG_DIRECTORY, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create log directory:', error.message);
}

/**
 * Format a timestamp for display
 * 
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Create a truncated preview of the message content
 * 
 * @param {string} message - The full message
 * @param {number} [maxLength=MAX_MESSAGE_PREVIEW_LENGTH] - Maximum preview length
 * @returns {string} Truncated message preview
 */
function createMessagePreview(message, maxLength = MAX_MESSAGE_PREVIEW_LENGTH) {
  if (!message) return '(empty message)';
  
  // Replace newlines and multiple spaces for cleaner display
  const cleaned = message.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  return cleaned.substring(0, maxLength) + '...';
}

/**
 * Sanitize recipient information for logging
 * 
 * @param {string} recipient - Recipient to sanitize
 * @param {boolean} fullSanitize - Whether to fully sanitize (true) or partial (false)
 * @returns {string} Sanitized recipient
 */
function sanitizeRecipient(recipient, fullSanitize = false) {
  if (!recipient) return 'unknown';
  
  // For console display where privacy is less critical, we can show more
  if (!fullSanitize) {
    return recipient;
  }
  
  // For file logs, sanitize more thoroughly
  // Email sanitization (show first 3 chars and domain)
  if (recipient.includes('@')) {
    const [localPart, domain] = recipient.split('@');
    if (localPart.length <= 3) {
      return recipient;
    }
    return `${localPart.substring(0, 3)}***@${domain}`;
  }
  
  // Phone number sanitization (show only last 4 digits)
  if (recipient.match(/^\+?[0-9\s\-()]{10,}$/)) {
    return recipient.replace(/[^0-9]/g, '').replace(/^(.*)(\d{4})$/, '******$2');
  }
  
  return recipient;
}

/**
 * Format a notification for console display
 * 
 * @param {Object} notification - Notification details
 * @returns {string} Formatted log entry for console
 */
function formatConsoleLog(notification) {
  const {
    timestamp,
    type,
    recipient,
    messagePreview,
    status,
    simulated
  } = notification;
  
  // Build status indicator
  const statusIndicator = status === 'sent' 
    ? colors.success('✓') 
    : colors.error('✗');
  
  // Build simulation indicator
  const simulatedTag = simulated 
    ? colors.simulated(' [SIMULATED]') 
    : '';
  
  // Format timestamp
  const timeStr = colors.timestamp(`[${timestamp}]`);
  
  // Format the notification type
  const typeStr = colors[type] ? 
    colors[type](`[${type.toUpperCase()}]`) : 
    `[${type.toUpperCase()}]`;
  
  // Format recipient
  const recipientStr = colors.recipient(recipient);
  
  // Format message preview
  const messageStr = colors.message(`"${messagePreview}"`);
  
  // Combine all parts
  return `${timeStr} ${statusIndicator}${simulatedTag} ${typeStr} To: ${recipientStr} | ${messageStr}`;
}

/**
 * Format a notification for file logging (plain text, sanitized)
 * 
 * @param {Object} notification - Notification details
 * @returns {string} Formatted log entry for file
 */
function formatFileLog(notification) {
  const {
    timestamp,
    type,
    recipient,
    messagePreview,
    status,
    simulated,
    messageId,
    ...rest
  } = notification;
  
  // Create JSON for file logging, with sanitized recipient
  const sanitized = {
    timestamp,
    type,
    recipient: sanitizeRecipient(recipient, true),
    messagePreview,
    status,
    simulated,
    messageId
  };
  
  // Add any additional fields that might be useful
  if (rest.options) {
    sanitized.options = { ...rest.options };
    // Remove any sensitive options
    delete sanitized.options.apiKey;
    delete sanitized.options.password;
    delete sanitized.options.token;
  }
  
  return JSON.stringify(sanitized);
}

/**
 * Log a notification to console and/or file
 * 
 * @param {string} type - Notification type (email, sms, push)
 * @param {string} recipient - Notification recipient
 * @param {string} message - Message content
 * @param {Object} options - Additional options
 * @param {boolean} [options.simulated=false] - Whether this was a simulated send
 * @param {string} [options.status='sent'] - Status of the notification
 * @param {string} [options.messageId] - Unique message identifier
 * @returns {Object} The logged notification object
 */
function logNotification(type, recipient, message, options = {}) {
  const timestamp = getTimestamp();
  const messagePreview = createMessagePreview(message);
  const status = options.status || (options.simulated ? 'simulated' : 'sent');
  const simulated = !!options.simulated;
  const messageId = options.messageId || `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Create notification object for logging
  const notification = {
    timestamp,
    type,
    recipient,
    message,
    messagePreview,
    status,
    simulated,
    messageId,
    options
  };
  
  // Log to console if enabled
  if (LOG_TO_CONSOLE) {
    const consoleLog = formatConsoleLog(notification);
    console.log(consoleLog);
  }
  
  // Log to file if enabled
  if (LOG_TO_FILE) {
    try {
      const fileLog = formatFileLog(notification) + '\n';
      fs.appendFileSync(NOTIFICATION_LOG_FILE, fileLog);
    } catch (error) {
      console.error('Failed to write to notification log file:', error.message);
    }
  }
  
  return notification;
}

/**
 * Get the notification log contents
 * 
 * @param {number} [maxLines=100] - Maximum number of lines to return
 * @returns {string} Notification log contents
 */
function getNotificationLog(maxLines = 100) {
  try {
    if (!fs.existsSync(NOTIFICATION_LOG_FILE)) {
      return 'No notification log file exists.';
    }
    
    const content = fs.readFileSync(NOTIFICATION_LOG_FILE, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    if (maxLines === -1) {
      return lines.join('\n');
    }
    
    // Return last N lines
    return lines.slice(-maxLines).join('\n');
  } catch (error) {
    return `Failed to read notification log: ${error.message}`;
  }
}

/**
 * Clear the notification log file
 */
function clearNotificationLog() {
  try {
    fs.writeFileSync(NOTIFICATION_LOG_FILE, '');
  } catch (error) {
    console.error('Failed to clear notification log:', error.message);
  }
}

/**
 * Create a pre-configured logger for a specific notification type
 * 
 * @param {string} type - The notification type
 * @returns {Function} A logger function for that notification type
 */
function createTypedLogger(type) {
  return (recipient, message, options = {}) => {
    return logNotification(type, recipient, message, options);
  };
}

// Create type-specific loggers
const logEmail = createTypedLogger('email');
const logSMS = createTypedLogger('sms');
const logPush = createTypedLogger('push');

module.exports = {
  logNotification,
  logEmail,
  logSMS,
  logPush,
  getNotificationLog,
  clearNotificationLog,
  createMessagePreview
};
