/**
 * Notification tracking utility
 * 
 * This module provides functionality for tracking notification events
 * across different channels and persisting them to a file.
 */

const fs = require('fs');
const path = require('path');

// File path for storing notifications
const NOTIFICATION_FILE = 'sent_notifications.json';

/**
 * Track a notification event
 * 
 * This function logs notification data to the console and writes it to a file.
 * If the file doesn't exist, it creates it with an initial empty array.
 * Each notification is assigned a unique notificationId based on the current timestamp.
 * If timestamp is not provided, it automatically generates one.
 * 
 * @param {Object} notificationData - The notification data to track
 * @param {string} notificationData.userId - The ID of the user receiving the notification
 * @param {string} notificationData.channel - The channel the notification was sent on (e.g., 'email', 'sms')
 * @param {string} notificationData.message - The message content or a reference to it
 * @param {string} notificationData.recipient - The contact detail the message was sent to (e.g., email address, phone number)
 * @param {string} notificationData.status - The status of the notification ('sent' or 'failed')
 * @param {Object} [notificationData.metadata] - Optional key-value pairs with additional information (e.g., { orderId: "A123" })
 * @param {string|number} [notificationData.timestamp] - The timestamp when the notification was sent (optional, generated if not provided)
 * @returns {void}
 */
function trackNotification({ userId, channel, message, recipient, status, metadata, timestamp }) {
  // Generate a unique notification ID using current timestamp
  const notificationId = Date.now();
  
  // Use provided timestamp or generate one if not provided
  const notificationTimestamp = timestamp || new Date().toISOString();

  // Check if message needs to be truncated (exceeds 100 characters)
  let truncated = false;
  let truncatedMessage = message;
  const MAX_MESSAGE_LENGTH = 100;
  
  if (message && typeof message === 'string' && message.length > MAX_MESSAGE_LENGTH) {
    truncatedMessage = message.substring(0, MAX_MESSAGE_LENGTH);
    truncated = true;
  }
  
  // Create the complete notification object with ID and status
  const notification = {
    notificationId,
    userId,
    channel,
    message: truncatedMessage,
    recipient, // The contact detail the message was sent to
    status, // This should be either 'sent' or 'failed'
    timestamp: notificationTimestamp
  };
  
  // Add truncation flag if message was shortened
  if (truncated) {
    notification.truncated = true;
  }
  
  // Add metadata if provided
  if (metadata && typeof metadata === 'object') {
    notification.metadata = metadata;
  }
  
  // Log to console for debugging
  console.log(notification);
  
  // Store the notification in the file
  try {
    let notifications = [];
    
    try {
      // Check if file exists and read existing notifications
      if (fs.existsSync(NOTIFICATION_FILE)) {
        const fileContent = fs.readFileSync(NOTIFICATION_FILE, 'utf8');
        notifications = JSON.parse(fileContent);
        
        // Validate that we have an array
        if (!Array.isArray(notifications)) {
          console.error('Invalid notification file format: expected an array');
          notifications = []; // Reset to empty array if format is invalid
        }
      }
    } catch (readError) {
      console.error('Error reading notification file:', readError);
      // Continue with an empty array if reading fails
    }
    
    // Add new notification
    notifications.push(notification);
      
    // Limit the number of notifications to the latest 100 entries
    const MAX_NOTIFICATIONS = 2;
    if (notifications.length > MAX_NOTIFICATIONS) {
      const excessEntries = notifications.length - MAX_NOTIFICATIONS;
      // Remove oldest entries (from the beginning of the array)
      notifications = notifications.slice(excessEntries);
      console.log(`Removed ${excessEntries} oldest notification entries to maintain limit of ${MAX_NOTIFICATIONS}`);
    }
    
    try {
      // Write back to file
      fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(notifications, null, 2), 'utf8');
    } catch (writeError) {
      console.error('Error writing to notification file:', writeError);
    }
  } catch (error) {
    // Catch any other unexpected errors in the overall process
    console.error('Unexpected error in notification tracking:', error);
  }
}

module.exports = { trackNotification };