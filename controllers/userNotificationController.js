/**
 * Controller for determining user notification preferences and preparing personalized templates
 * @module userNotificationController
 */

const userPreferences = require('../user-preferences');
const { getTemplate } = require('../templateManager');

/**
 * Test data for template personalization - in a real app, this would come from the request
 */
const TEST_DATA = {
  welcome: {
    serviceName: 'NotifyX',
    userName: 'Test User',
    verificationLink: 'https://notifyx.example.com/verify?token=test123',
    supportEmail: 'support@notifyx.example.com'
  },
  otp: {
    serviceName: 'NotifyX',
    userName: 'Test User',
    otpCode: '123456',
    expiryTime: '15'
  },
  passwordReset: {
    serviceName: 'NotifyX',
    userName: 'Test User',
    resetLink: 'https://notifyx.example.com/reset?token=test123',
    expiryTime: '24'
  }
};

/**
 * Determines which notification channels a user has opted in to
 * and checks eligibility for receiving the requested notification type
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
    
    if (!userPrefs) {
      console.log(`User preferences not found for email: ${email}`);
      return {
        success: false,
        error: 'User preferences not found',
        channels: []
      };
    }

    // Check if this notification type is supported for the user
    if (!userPrefs.notificationTypes || !userPrefs.notificationTypes[notificationType]) {
      console.log(`Notification type '${notificationType}' not configured for user ${email}`);
      return {
        success: false,
        error: `Notification type '${notificationType}' not configured`,
        channels: []
      };
    }

    // Determine which channels the user has opted in to for this notification type
    const channels = [];
    const preferences = { email: false, sms: false };

    // Check email preferences
    if (userPrefs.emailEnabled && userPrefs.notificationTypes[notificationType]?.email) {
      channels.push('email');
      preferences.email = true;
    }

    // Check SMS preferences
    if (userPrefs.smsEnabled && userPrefs.notificationTypes[notificationType]?.sms && userPrefs.phone) {
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
 * Loads and personalizes templates for each notification channel based on user preferences
 * 
 * @param {string} notificationType - The type of notification (e.g., 'welcome', 'otp')
 * @param {string} language - The user's preferred language
 * @param {Array<string>} channels - The channels to load templates for
 * @param {Object} data - Data for template personalization
 * @returns {Object} An object containing personalized templates for each channel
 */
function loadAndPersonalizeTemplates(notificationType, language, channels, userData) {
  // Default to English if no language specified
  const userLanguage = language || 'en';
  const templates = {};
  
  // Prepare test data specific to this notification type
  const templateData = {
    ...TEST_DATA[notificationType] || {},
    userName: userData.name || 'Valued Customer',
    // Add any other user-specific data here
  };
  
  console.log(`Loading templates for notification type: ${notificationType}, language: ${userLanguage}`);
  
  // Load templates for each channel
  for (const channel of channels) {
    try {
      // Get template appropriate for this channel, notification type, and language
      const template = getTemplate(channel, notificationType, userLanguage, {
        includeMetadata: true,  // Include metadata about template selection
        strictMode: false       // Allow fallback to other languages if necessary
      });
      
      if (!template) {
        console.log(`Template not found for channel: ${channel}, type: ${notificationType}, language: ${userLanguage}`);
        continue;
      }
      
      // Store template and personalization data
      templates[channel] = {
        originalTemplate: template,
        personalizedContent: personalizeTemplate(template, templateData),
        data: templateData,
        metadata: {
          type: channel,
          name: notificationType,
          language: userLanguage,
          fallbackUsed: template.metadata?.fallbackUsed || false,
          selectedLanguage: template.metadata?.selectedLanguage || userLanguage
        }
      };
      
      const selectedLanguage = template.metadata?.selectedLanguage || userLanguage;
      console.log(`Prepared ${channel} template for ${notificationType} notification in ${selectedLanguage}`);
    } catch (error) {
      console.log(`Error preparing template for channel ${channel}, type ${notificationType}:`, error);
    }
  }
  
  return templates;
}

/**
 * Personalizes a template by replacing placeholders with actual data
 * 
 * @param {Object|string} template - The template to personalize
 * @param {Object} data - The data to use for personalization
 * @returns {Object|string} The personalized template
 */
function personalizeTemplate(template, data) {
  if (!template) return null;
  
  // Handle different template formats based on channel type
  if (typeof template === 'string') {
    // Simple string template (SMS)
    return replaceTemplateVariables(template, data);
  } else if (template.subject && template.body) {
    // Email template with subject and body
    return {
      subject: replaceTemplateVariables(template.subject, data),
      body: replaceTemplateVariables(template.body, data)
    };
  }
  
  // Return as-is if format is not recognized
  return template;
}

/**
 * Replaces {{variables}} in a template string with values from data object
 * 
 * @param {string} templateString - The template string with {{variable}} placeholders
 * @param {Object} data - Object containing replacement values
 * @returns {string} - The processed string with values inserted
 */
function replaceTemplateVariables(templateString, data) {
  if (!templateString || typeof templateString !== 'string') return templateString;
  
  return templateString.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = data[key.trim()];
    return value !== undefined ? value : match; // Keep original placeholder if value not found
  });
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
  // Get user notification channels and check eligibility
  const channelInfo = await getUserNotificationChannels(email, notificationType);
  
  if (!channelInfo.success) {
    console.log(`User ${email} is not eligible to receive ${notificationType} notification: ${channelInfo.error}`);
    return {
      success: false,
      error: channelInfo.error,
      details: 'User not eligible for this notification type'
    };
  }
  
  const { channels, userData } = channelInfo;
  
  // If no channels are enabled, log that the user has not opted in and exit gracefully
  if (channels.length === 0) {
    console.log(`User ${email} has not opted in to receive ${notificationType} notifications on any channel`);
    return {
      success: false,
      error: 'No notification channels enabled for this notification type',
      channels: [],
      message: `User has opted out of all channels for this notification type`
    };
  }
  
  // Load and personalize templates for each channel
  const personalizedTemplates = loadAndPersonalizeTemplates(
    notificationType, 
    userData.language, 
    channels,
    {
      ...userData,
      ...data
    }
  );
  
  // Check if we have at least one valid template
  const validChannels = Object.keys(personalizedTemplates);
  if (validChannels.length === 0) {
    console.log(`No valid templates found for any eligible channel for ${email}`);
    return {
      success: false,
      error: 'No valid templates found for eligible channels',
      channels: channels
    };
  }
  
  // In a real implementation, we would call mock services here
  // For now, just return the channels and personalized templates
  
  // Log successful template preparation
  console.log(`Successfully prepared templates for ${validChannels.length} channel(s) for ${email}`);
  validChannels.forEach(channel => {
    const templateInfo = personalizedTemplates[channel];
    console.log(`→ ${channel} template (${templateInfo.metadata.selectedLanguage}): Ready to send`);
  });
  
  return {
    success: true,
    message: `Notification templates prepared successfully`,
    channels: validChannels,
    userData: {
      email: userData.email,
      phone: userData.phone,
      name: userData.name,
      language: userData.language
    },
    notificationType,
    templates: personalizedTemplates
  };
}

module.exports = {
  getUserNotificationChannels,
  sendUserNotification,
  loadAndPersonalizeTemplates
};