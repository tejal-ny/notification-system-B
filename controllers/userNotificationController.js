/**
 * Controller for determining user notification preferences for different channels
 * @module userNotificationController
 */

const userPreferences = require('../user-preferences');
// const console.log require('../logger').createTypedLogger('user-notification-controller');

/**
 * Determines which notification channels a user has opted in to
 * based on their preferences and notification type
 * 
 * @param {string} email - The email address of the user
 * @param {string} notificationType - The type of notification (e.g., 'welcome', 'otp')
 * @returns {Promise<Object>} An object containing the user's notification preferences
 */
async function getUserNotificationChannels(email, notificationType) {
  // Input validation
  if (!email) {
    console.log('Email address is required');
    return {
      success: false,
      error: 'Email address is required',
      channels: []
    };
  }

  if (!notificationType) {
    console.log('Notification type is required');
    return {
      success: false,
      error: 'Notification type is required',
      channels: []
    };
  }

  try {
    // Get user preferences by email
    const userPrefs = await userPreferences.getUserPreferences(email);

    console.log(`Retrieved preferences for ${email}:`, userPrefs);
    
    if (!userPrefs) {
      console.log(`User preferences not found for email: ${email}`);
      return {
        success: false,
        error: 'User preferences not found',
        channels: []
      };
    }

    // Determine which channels the user has opted in to for this notification type
    const channels = [];
    const preferences = { email: false, sms: false };

    // Check email preferences
    if (userPrefs.emailEnabled) {
      channels.push('email');
      preferences.email = true;
    }

    // Check SMS preferences
    if (userPrefs.smsEnabled) {
      channels.push('sms');
      preferences.sms = true;
    }

    // Return user's notification channels and preferences
    return {
      success: true,
      userData: {
        email: userPrefs.email,
        phone: userPrefs.smsEnabled ? userPrefs.phone : null,
        name: userPrefs.name || 'Valued Customer',
        language: userPrefs.language || 'en'
      },
      channels,
      preferences,
      notificationType
    };
  } catch (error) {
    console.log(`Error retrieving notification preferences for ${email}:`, error);
    return {
      success: false,
      error: error.message || 'Error retrieving user preferences',
      channels: []
    };
  }
}

/**
 * Sends notifications to a user through their preferred channels
 * using mock services for demonstration purposes
 * 
 * @param {string} email - The email address of the user
 * @param {string} notificationType - The type of notification (e.g., 'welcome', 'otp')
 * @param {Object} [data={}] - Data to populate the notification templates
 * @returns {Promise<Object>} A result object with details about the notification attempts
 */
async function sendUserNotification(email, notificationType, data = {}) {
  // Get user notification channels
  const channelInfo = await getUserNotificationChannels(email, notificationType);
  
  if (!channelInfo.success) {
    return {
      success: false,
      error: channelInfo.error,
      details: 'Failed to determine notification channels'
    };
  }
  
  const { channels, userData } = channelInfo;
  
  // If no channels are enabled, return early
  if (channels.length === 0) {
    console.log(`User ${email} has not opted in to receive ${notificationType} notifications on any channel`);
    return {
      success: false,
      error: 'No notification channels enabled for this notification type',
      channels: []
    };
  }
  
  // For demonstration, log which channels would be used
  console.log(`User ${email} will receive ${notificationType} notification via: ${channels.join(', ')}`);
  
  // This is where we would call mock services for each channel
  // For now, just return the determination results
  return {
    success: true,
    message: `Notification channels determined successfully`,
    channels,
    userData: {
      email: userData.email,
      phone: userData.phone,
      name: userData.name,
      language: userData.language
    },
    notificationType
  };
}

module.exports = {
  getUserNotificationChannels,
  sendUserNotification
};