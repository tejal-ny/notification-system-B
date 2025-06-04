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
 * If no timestamp is provided, one is automatically generated.
 * 
 * @param {Object} notificationData - The notification data to track
 * @param {string} notificationData.userId - The ID of the user receiving the notification
 * @param {string} notificationData.channel - The channel the notification was sent on (e.g., 'email', 'sms')
 * @param {string} notificationData.message - The message content or a reference to it
 * @param {string} [notificationData.timestamp] - The timestamp when the notification was sent (generated automatically if not provided)
 * @param {string} notificationData.status - The status of the notification ('sent' or 'failed')
 * @returns {void}
 */
function trackNotification({ userId, channel, message, timestamp, status }) {
  // Generate a unique notification ID using current timestamp
  const notificationId = Date.now();
  
  // Create the complete notification object with ID and status
  const notification = {
    notificationId,
    userId,
    channel,
    message,
    // Use provided timestamp or generate a new one if not provided
    timestamp: timestamp || new Date().toISOString(),
    status // This should be either 'sent' or 'failed'
  };
  
  // Log to console for debugging
  console.log(notification);
  
  // Store the notification in the file
  try {
    let notifications = [];
    
    // Check if file exists
    if (fs.existsSync(NOTIFICATION_FILE)) {
      // Read existing notifications
      const fileContent = fs.readFileSync(NOTIFICATION_FILE, 'utf8');
      notifications = JSON.parse(fileContent);
    }
    
    // Add new notification
    notifications.push(notification);
    
    // Write back to file
    fs.writeFileSync(NOTIFICATION_FILE, JSON.stringify(notifications, null, 2), 'utf8');
  } catch (error) {
    console.error('Error storing notification:', error);
  }
}

module.exports = { trackNotification };