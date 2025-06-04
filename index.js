/**
 * Main entry point for the notification system
 */

// Import required modules
const path = require("path");
const fs = require("fs");

// Import notification modules
const notificationSystem = require("./notifications");
const dispatcher = require('./dispatcher');
const logger = require('./logger');
const trackNotification = require('./notificationTracker').trackNotification;

// Initialize the notification system
console.log("Initializing notification system...");

// Legacy function for backward compatibility
function sendNotification(type, recipient, message, options = {}) {
  if (!notifications[type]) {
    throw new Error(`Notification type '${type}' is not supported`);
  }
  
  return notifications[type].send(recipient, message, options);
}


// Example of sending notifications
async function runExamples() {
  try {
    // Email example
    console.log('\nSending an email notification:');
    const emailResult = await notificationSystem.send(
      notificationSystem.types.EMAIL,
      'recipient@example.com',
      'This is a test email message.',
      {
        subject: 'Test Email',
        from: 'sender@example.com'
      }
    );
    console.log('Email sent:', emailResult);
    
    // SMS example
    console.log('\nSending an SMS notification:');
    const smsResult = await notificationSystem.send(
      notificationSystem.types.SMS,
      '+12345678901', // Replace with a valid phone number
      'This is a test SMS message from the notification system.'
    );
    console.log('SMS sent:', smsResult);
    
    // Invalid phone example
    console.log('\nTrying to send to invalid phone number:');
    await notificationSystem.send(
      notificationSystem.types.SMS,
      '123', // Invalid number
      'This should fail validation.'
    );
    
  } catch (error) {
    console.error('Error in notification examples:', error.message);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

// If this file is run directly, start the notification service
async function sendExampleEmails() {
  try {
    // Valid email example
    console.log("\nSending to valid email address:");
    const result = await notificationSystem.send(
      notificationSystem.types.EMAIL,
      "valid.user@example.com",
      "This is a test of the email validation system.",
      {
        subject: "Valid Email Test",
        from: "notification-system@example.com",
      }
    );
    console.log("Success:", result);

    // Invalid email example
    console.log("\nAttempting to send to invalid email address:");
    await notificationSystem.send(
      notificationSystem.types.EMAIL,
      "invalid-email-address",
      "This message should not be sent.",
      {
        subject: "Invalid Email Test",
      }
    );
  } catch (error) {
    console.error("Test error caught:", error.message);
    if (error.code === "INVALID_RECIPIENT" && error.invalidEmails) {
      console.error("Failed due to invalid recipients:", error.invalidEmails);
    }
  }

  // Multiple recipients - some valid, some invalid
  try {
    console.log("\nAttempting to send to mixed email addresses:");
    await notificationSystem.send(
      notificationSystem.types.EMAIL,
      "valid.user@example.com, invalid-address, another.user@example.com",
      "This message should not be sent due to partial invalid recipients.",
      {
        subject: "Mixed Email Test",
      }
    );
  } catch (error) {
    console.error("Test error caught:", error.message);
    if (error.code === "INVALID_RECIPIENT" && error.invalidEmails) {
      console.error("Failed due to invalid recipients:", error.invalidEmails);
    }
  }
}



// Example usage
async function main() {
  const result = trackNotification({
    notificationId: 1717636799123,
    userId: 'example-user',
    channel: 'email',
    message: 'This is a test notification',
    recipient: 'tejal@example.com',
    // timestamp: new Date().toISOString(),
    status: 'sent',
    metadata: {
      orderId: 'A123',
      additionalInfo: 'Test notification for example purposes'
    }
  });
}
if (require.main === module) {
  console.log('Notification System initialized');
  console.log('Available notification types:', dispatcher.getSupportedTypes());
    
  // Example usage of the new dispatcher
  if (process.argv[2] === 'test') {
    console.log('Running test notifications...');
    
    // Example email notification
    const emailNotification = {
      type: 'email',
      recipient: 'test@example.com',
      message: 'This is a test email notification',
      options: {
        subject: 'Test Notification'
      }
    };
    
    // Example SMS notification
    const smsNotification = {
      type: 'sms',
      recipient: '+15551234567',
      message: 'This is a test SMS notification'
    };
    
    // Example of unsupported type
    const unsupportedNotification = {
      type: 'fax', // Not supported
      recipient: '555-123-4567',
      message: 'This is a test fax notification'
    };
    
    // Test dispatcher with email notification
    console.log('Dispatching email notification...');
    dispatcher.dispatchNotification(emailNotification)
      .then(result => console.log('Email notification result:', result))
      .catch(error => console.error('Email notification error:', error.message));
    
    // Test dispatcher with SMS notification
    console.log('Dispatching SMS notification...');
    dispatcher.dispatchNotification(smsNotification)
      .then(result => console.log('SMS notification result:', result))
      .catch(error => console.error('SMS notification error:', error.message));
    
    // Test dispatcher with unsupported notification type
    console.log('Dispatching unsupported notification type...');
    try {
      dispatcher.dispatchNotification(unsupportedNotification);
    } catch (error) {
      console.error('Expected error with unsupported type:', error.message);
    }
  }
  console.log("Starting notification service with validation examples...");
  // runExamples();
  main();
}

// Export all notification methods and the new dispatcher
module.exports = {
  // ...notifications,
  sendNotification,
  dispatch: dispatcher.dispatchNotification,
  isNotificationTypeSupported: dispatcher.isTypeSupported,
  getSupportedNotificationTypes: dispatcher.getSupportedTypes,
    // Expose validation utilities
  validateNotification: dispatcher.validateNotification,
  isValidEmail: dispatcher.isValidEmail,
  isValidPhoneNumber: dispatcher.isValidPhoneNumber,
  
  // Expose error handling utilities
  getErrorLog: dispatcher.getErrorLog,
  clearErrorLog: dispatcher.clearErrorLog,
  
  // Expose notification logging utilities
  getNotificationLog: dispatcher.getNotificationLog,
  clearNotificationLog: dispatcher.clearNotificationLog,
  logNotification: logger.logNotification,
  
  // Expose utility modules directly for advanced usage
  // errorHandler,
  logger
};
