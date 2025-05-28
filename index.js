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
// async function sendExampleEmails() {
//   try {
//     // Valid email example
//     console.log("\nSending to valid email address:");
//     const result = await notificationSystem.send(
//       notificationSystem.types.EMAIL,
//       "valid.user@example.com",
//       "This is a test of the email validation system.",
//       {
//         subject: "Valid Email Test",
//         from: "notification-system@example.com",
//       }
//     );
//     console.log("Success:", result);

//     // Invalid email example
//     console.log("\nAttempting to send to invalid email address:");
//     await notificationSystem.send(
//       notificationSystem.types.EMAIL,
//       "invalid-email-address",
//       "This message should not be sent.",
//       {
//         subject: "Invalid Email Test",
//       }
//     );
//   } catch (error) {
//     console.error("Test error caught:", error.message);
//     if (error.code === "INVALID_RECIPIENT" && error.invalidEmails) {
//       console.error("Failed due to invalid recipients:", error.invalidEmails);
//     }
//   }

//   // Multiple recipients - some valid, some invalid
//   try {
//     console.log("\nAttempting to send to mixed email addresses:");
//     await notificationSystem.send(
//       notificationSystem.types.EMAIL,
//       "valid.user@example.com, invalid-address, another.user@example.com",
//       "This message should not be sent due to partial invalid recipients.",
//       {
//         subject: "Mixed Email Test",
//       }
//     );
//   } catch (error) {
//     console.error("Test error caught:", error.message);
//     if (error.code === "INVALID_RECIPIENT" && error.invalidEmails) {
//       console.error("Failed due to invalid recipients:", error.invalidEmails);
//     }
//   }
// }

// If this file is run directly, run the examples
if (require.main === module) {
  console.log("Starting notification service with validation examples...");
  runExamples();
}

// Export notification functionality for use in other modules
module.exports = notificationSystem;
