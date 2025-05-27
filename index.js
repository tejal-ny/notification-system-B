/**
 * Main entry point for the notification system
 */

// Import required modules
const path = require("path");
const fs = require("fs");

// Import notification modules
const notificationSystem = require("./notifications");

// Initialize the notification system
console.log("Initializing notification system...");

// Export notification functionality for use in other modules
module.exports = notificationSystem;

// If this file is run directly, start the notification service
if (require.main === module) {
  console.log('Starting notification service...');
  
  // Example of sending an email notification
  notificationSystem.send(
    notificationSystem.types.EMAIL,
    'recipient@example.com',
    'This is the email body content.',
    {
      subject: 'Test Notification',
      from: 'sender@example.com'
    }
  ).then(result => {
    console.log('Notification sent successfully:', result);
  }).catch(error => {
    console.error('Failed to send notification:', error);
  });
}
