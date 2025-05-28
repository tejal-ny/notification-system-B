/**
 * Notification system module
 */

// Define supported notification types
const NOTIFICATION_TYPES = {
  EMAIL: "email",
  SMS: "sms",
  PUSH: "push",
  WEBHOOK: "webhook",
};
/**
 * Notification system module
 */
const smsNotifier = require('./sms');

// Import notification providers
const emailNotifier = require("./emails");
// import emailNotifier from "./emails"
// Store notification handlers
const notificationHandlers = {
  [NOTIFICATION_TYPES.EMAIL]: emailNotifier.sendEmail,
  // Other handlers will be added as implemented
};

// Notification system core functionality
const notificationSystem = {
  // Send a notification
  send: async (type, recipient, message, options = {}) => {
    console.log(`Sending ${type} notification to ${recipient}`);

    if (!notificationHandlers[type]) {
      const error = new Error(`Notification type '${type}' not supported`);
      error.code = "UNSUPPORTED_TYPE";
      return Promise.reject(error);
    }

    try {
      // For email notifications, use subject and message format
      if (type === NOTIFICATION_TYPES.EMAIL) {
        return await notificationHandlers[type](
          recipient,
          options.subject || "Notification",
          message,
          options
        );
      }

      // For other notification types
      return await notificationHandlers[type](recipient, message, options);
    } catch (error) {
      console.error(`Failed to send ${type} notification:`, error);
      throw error;
    }
  },

  // Register notification handler
  registerHandler: (type, handler) => {
    console.log(`Registering handler for ${type} notifications`);
    notificationHandlers[type] = handler;
    return notificationSystem; // For method chaining
  },

  // Get available notification types
  getTypes: () => {
    return Object.values(NOTIFICATION_TYPES);
  },
   // Check if a notification type is supported
  isSupported: (type) => {
    return !!notificationHandlers[type];
  }
};

// Export notification types and system
module.exports = {
  types: NOTIFICATION_TYPES,
  ...notificationSystem,
};
