
/**
 * Notification Dispatcher Examples
 * 
 * This file contains examples of how to use the notification dispatcher.
 * Run this file directly to see the examples in action:
 * 
 * node examples/dispatch-examples.js
 */

// Load environment variables for SMS credentials
require('dotenv').config();

// Import the notification system
const notifier = require('../index');

/**
 * Example 1: Basic usage with different notification types
 */
function basicExamples() {
  console.log('------ Basic Examples ------');
  
  // Display available notification types
  console.log('Supported notification types:', notifier.getSupportedNotificationTypes());
  
  // Email notification
  const emailNotification = {
    type: 'email',
    recipient: 'user@example.com',
    message: 'Welcome to our service!',
    options: {
      subject: 'Welcome Message',
      from: 'noreply@example.com'
    }
  };
  
  // SMS notification
  const smsNotification = {
    type: 'sms',
    recipient: '+15551234567',
    message: 'Your verification code is 123456',
    options: {
      // Any Twilio-specific options could go here
    }
  };
  
  // Dispatch the notifications
  console.log('\nDispatching email notification...');
  notifier.dispatch(emailNotification)
    .then(result => console.log('Email result:', result))
    .catch(error => console.error('Email error:', error.message));
  
  console.log('\nDispatching SMS notification...');
  notifier.dispatch(smsNotification)
    .then(result => console.log('SMS result:', result))
    .catch(error => console.error('SMS error:', error.message));
}

/**
 * Example 2: Handling unsupported notification types
 */
function errorHandlingExamples() {
  console.log('\n------ Error Handling Examples ------');
  
  // Unsupported notification type
  const faxNotification = {
    type: 'fax',  // Not supported
    recipient: '+15551234567',
    message: 'This is a fax message'
  };
  
  // Missing required fields
  const incompleteNotification = {
    type: 'email'
    // Missing recipient and message
  };
  
  // Check if a type is supported before dispatching
  console.log('\nChecking if types are supported:');
  console.log('- Email supported:', notifier.isNotificationTypeSupported('email'));
  console.log('- SMS supported:', notifier.isNotificationTypeSupported('sms'));
  console.log('- Fax supported:', notifier.isNotificationTypeSupported('fax'));
  
  // Try to dispatch unsupported type
  console.log('\nAttempting to dispatch unsupported notification type (fax)...');
  notifier.dispatch(faxNotification)
    .then(result => console.log('This should not happen:', result))
    .catch(error => console.log('Expected error:', error.message));
  
  // Try to dispatch incomplete notification
  console.log('\nAttempting to dispatch incomplete notification...');
  notifier.dispatch(incompleteNotification)
    .then(result => console.log('This should not happen:', result))
    .catch(error => console.log('Expected error:', error.message));
}

/**
 * Example 3: Dynamic type selection
 */
function dynamicTypeExample() {
  console.log('\n------ Dynamic Type Selection Example ------');
  
  // Function to send a notification based on user preferences
  function sendUserNotification(userId, message, preferredChannel = 'email') {
    // In a real app, you might fetch user data from a database
    const userData = {
      '1': { email: 'user1@example.com', phone: '+15551234567', preferences: { channel: 'email' } },
      '2': { email: 'user2@example.com', phone: '+15557654321', preferences: { channel: 'sms' } }
    };
    
    const user = userData[userId];
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Use the user's preferred channel or fall back to the default
    const channel = user.preferences.channel || preferredChannel;
    
    // Check if the preferred channel is supported
    if (!notifier.isNotificationTypeSupported(channel)) {
      console.log(`User's preferred channel '${channel}' is not supported, falling back to email`);
      // Fall back to email if the preferred channel is not supported
      channel = 'email';
    }
    
    // Determine the recipient based on the channel
    const recipient = channel === 'email' ? user.email : user.phone;
    
    // Create and dispatch the notification
    const notification = {
      type: channel,
      recipient,
      message,
      options: {}
    };
    
    console.log(`\nSending ${channel} notification to user ${userId}...`);
    return notifier.dispatch(notification);
  }
  
  // Send notifications to two users with different preferences
  sendUserNotification('1', 'Hello user 1!')
    .then(result => console.log('User 1 notification result:', result))
    .catch(error => console.error('User 1 notification error:', error.message));
  
  sendUserNotification('2', 'Hello user 2!')
    .then(result => console.log('User 2 notification result:', result))
    .catch(error => console.error('User 2 notification error:', error.message));
}

// Run the examples
async function runAllExamples() {
  try {
    basicExamples();
    
    // Slight delay to make output more readable
    await new Promise(resolve => setTimeout(resolve, 500));
    
    errorHandlingExamples();
    
    // Slight delay to make output more readable
    await new Promise(resolve => setTimeout(resolve, 500));
    
    dynamicTypeExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run all examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  basicExamples,
  errorHandlingExamples,
  dynamicTypeExample,
  runAllExamples
};