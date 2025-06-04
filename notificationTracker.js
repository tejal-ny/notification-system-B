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
 * Records the notification data to a JSON file. If the file doesn't exist,
 * it creates the file with an initial empty array structure.
 * 
 * @param {Object} notificationData - The notification data to track
 * @param {string} notificationData.userId - The ID of the user receiving the notification
 * @param {string} notificationData.channel - The channel the notification was sent on (e.g., 'email', 'sms')
 * @param {string} notificationData.message - The message content or a reference to it
 * @param {string|number} notificationData.timestamp - The timestamp when the notification was sent
 * @returns {void}
 */
function trackNotification({ userId, channel, message, timestamp }) {
  try {
    // Create the notification entry
    const notificationEntry = { userId, channel, message, timestamp };
    
    // Log to console for debugging purposes
    console.log('Tracking notification:', notificationEntry);
    
    // Read existing notifications
    let notifications = [];
    
    // Check if the file exists
    if (fs.existsSync(NOTIFICATIONS_FILE)) {
      try {
        const fileContent = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
        notifications = JSON.parse(fileContent);
        
        // Validate that the content is an array
        if (!Array.isArray(notifications)) {
          console.error('Notifications file contains invalid data. Resetting to empty array.');
          notifications = [];
        }
      } catch (parseError) {
        console.error('Error parsing notifications file:', parseError);
        // Reset to empty array if file is corrupted
        notifications = [];
      }
    } else {
      console.log('Notifications file does not exist. Creating new file.');
    }
    
    // Add the new notification
    notifications.push(notificationEntry);
    
    // Write the updated array back to the file
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), 'utf8');
    
    console.log('Notification saved successfully.');
  } catch (error) {
    console.error('Failed to track notification:', error);
  }
}

module.exports = { trackNotification };