/**
 * Notification tracking utility
 * 
 * This module provides functionality for tracking notification events
 * across different channels and persisting them to a file.
 */

const fs = require('fs');
const path = require('path');

// File path for storing notifications
const NOTIFICATIONS_FILE = 'sent_notifications.json';

/**
 * Track a notification event
 * 
 * This function logs notification data to the console and writes it to a file.
 * If the file doesn't exist, it creates it with an initial empty array.
 * Each notification is assigned a unique notificationId based on timestamp.
 * 
 * @param {Object} notificationData - The notification data to track
 * @param {string} notificationData.userId - The ID of the user receiving the notification
 * @param {string} notificationData.channel - The channel the notification was sent on (e.g., 'email', 'sms')
 * @param {string} notificationData.message - The message content or a reference to it
 * @param {string|number} notificationData.timestamp - The timestamp when the notification was sent
 * @returns {Object} The notification object with added notificationId
 */
function trackNotification({ userId, channel, message, timestamp }) {
  // Generate a unique notification ID based on current timestamp
  const notificationId = Date.now().toString();
  
  // Create the complete notification object with ID
  const notificationObject = {
    notificationId,
    userId,
    channel,
    message,
    timestamp
  };
  
  // Log to console for debugging
  console.log(notificationObject);
  
  // Store the notification in the file
  try {
    let notifications = [];
    
    // Check if file exists
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      // Read existing notifications
      const fileContent = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
      notifications = JSON.parse(fileContent);
    }
    
    // Add new notification
    notifications.push(notificationObject);
    
    // Write back to file
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), 'utf8');
    
    // Return the notification object with ID
    return notificationObject;
  } catch (error) {
    console.error('Error storing notification:', error);
    return notificationObject;
  }
}

module.exports = { trackNotification };