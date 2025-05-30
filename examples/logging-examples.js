/**
 * Notification Logging Examples
 * 
 * This file demonstrates the notification logging capabilities of the system.
 * Run this file directly to see the logging in action:
 * 
 * node examples/logging-examples.js
 */

// Load environment variables
require('dotenv').config();

// Import the notification system
const notifier = require('../index');

/**
 * Example 1: Basic logging for different notification types
 */
async function basicLoggingExamples() {
  console.log('------ Basic Notification Logging Examples ------');
  
  // Send email notification - will be logged automatically
  console.log('\n1. Sending email notification (will be logged):');
  await notifier.dispatch({
    type: 'email',
    recipient: 'user@example.com',
    message: 'This is a test email notification that will be logged automatically.'
  });
  
  // Send SMS notification - will be logged automatically
  console.log('\n2. Sending SMS notification (will be logged):');
  await notifier.dispatch({
    type: 'sms',
    recipient: '+15551234567',
    message: 'This is a test SMS that will be logged automatically.'
  });
  
  // Send push notification - will be logged automatically
  console.log('\n3. Sending push notification (will be logged):');
  await notifier.dispatch({
    type: 'push',
    recipient: 'device-token-123',
    message: 'This is a test push notification that will be logged automatically.'
  });
  
  // Notice the difference between real and simulated notifications in the logs
}

/**
 * Example 2: Manual logging (for cases outside the standard flow)
 */
function manualLoggingExamples() {
  console.log('\n------ Manual Notification Logging Examples ------');
  
  // Log notifications manually without sending them
  console.log('\n1. Manually logging an email notification:');
  notifier.logger.logEmail(
    'custom@example.com',
    'This email was manually logged without actually sending it',
    {
      subject: 'Manual Log Example',
      simulated: true, // Mark as simulated
      status: 'manual-entry'
    }
  );
  
  // Log an SMS manually
  console.log('\n2. Manually logging an SMS notification:');
  notifier.logger.logSMS(
    '+15559876543',
    'This SMS was manually logged without actually sending it',
    {
      simulated: true,
      status: 'manual-entry'
    }
  );
  
  // Custom notification type logging
  console.log('\n3. Logging a custom notification type:');
  notifier.logger.logNotification(
    'webhook', // Custom type
    'https://api.example.com/webhook',
    'Webhook notification payload',
    {
      simulated: false,
      status: 'sent',
      method: 'POST',
      responseCode: 200
    }
  );
}

/**
 * Example 3: Reading notification logs
 */
async function readNotificationLogsExample() {
  console.log('\n------ Reading Notification Logs Example ------');
  
  // Generate a few more notifications
  await notifier.dispatch({
    type: 'email',
    recipient: 'logs-test@example.com',
    message: 'This is a test for log reading.'
  });
  
  await notifier.dispatch({
    type: 'sms',
    recipient: '+15551112222',
    message: 'Another test for log reading.'
  });
  
  // Get notification logs
  console.log('\nRetrieving notification logs:');
  const logs = notifier.getNotificationLog(5);  // Get last 5 entries
  console.log(logs);
}

/**
 * Example 4: Different message formats and lengths
 */
async function messageFormatsExample() {
  console.log('\n------ Message Format Examples ------');
  
  // Multi-line message
  const multiLineMessage = `This is a multi-line message.
It has several lines of content.
The logger should format it properly.`;
  
  console.log('\n1. Sending notification with multi-line message:');
  await notifier.dispatch({
    type: 'email',
    recipient: 'multiline@example.com',
    message: multiLineMessage
  });
  
  // Long message
  const longMessage = 'This is a very long message that should be truncated in the log preview. '.repeat(10);
  
  console.log('\n2. Sending notification with long message:');
  await notifier.dispatch({
    type: 'sms',
    recipient: '+15553334444',
    message: longMessage
  });
  
  // Message with special characters
  const specialCharsMessage = 'Special chars: éöàçñ 🚀 👍 ⚠️ <script>alert("hi")</script>';
  
  console.log('\n3. Sending notification with special characters:');
  await notifier.dispatch({
    type: 'email',
    recipient: 'special@example.com',
    message: specialCharsMessage
  });
}

/**
 * Example 5: Failed notifications
 */
async function failedNotificationsExample() {
  console.log('\n------ Failed Notifications Example ------');
  
  // Trigger a validation error
  console.log('\n1. Sending notification with invalid email (will fail):');
  await notifier.dispatch({
    type: 'email',
    recipient: 'not-valid-email',
    message: 'This should fail validation but still be logged.'
  });
  
  // Trigger an error during sending
  console.log('\n2. Sending notification that will fail during sending:');
  await notifier.dispatch({
    type: 'email',
    recipient: 'error@example.com',  // This will trigger an error
    message: 'This should fail during sending but still be logged.'
  });
  
  // Check that both successful and failed notifications appear in logs
  console.log('\n3. Verifying that both successful and failed notifications are logged:');
  const logs = notifier.getNotificationLog(4);
  console.log(logs);
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    // Clear logs for a clean demonstration
    notifier.clearNotificationLog();
    notifier.clearErrorLog();
    console.log('Cleared existing logs for demonstration');
    
    await basicLoggingExamples();
    
    // Slight delay to make output more readable
    await new Promise(resolve => setTimeout(resolve, 500));
    
    manualLoggingExamples();
    
    // Slight delay to make output more readable
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await readNotificationLogsExample();
    
    // Slight delay to make output more readable
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await messageFormatsExample();
    
    // Slight delay to make output more readable
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await failedNotificationsExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run all examples if this file is executed directly
if (require.main === module) {
  console.log('Running notification logging examples...');
  runAllExamples()
    .then(() => console.log('\nAll logging examples completed.'))
    .catch(err => console.error('Failed to run examples:', err));
}

module.exports = {
  basicLoggingExamples,
  manualLoggingExamples,
  readNotificationLogsExample,
  messageFormatsExample,
  failedNotificationsExample,
  runAllExamples
};
