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

const DEFAULT_TEST_DATA = {
    serviceName: 'NotifyHub',
    userName: 'Valued Customer',
    verificationLink: 'https://example.com/verify?token=sample-token-12345',
    resetLink: 'https://example.com/reset-password?token=sample-token-12345',
    supportEmail: 'support@example.com',
    otpCode: '123456',
    expiryTime: '15',
    appointmentDate: '2023-06-15',
    appointmentTime: '14:30',
    amount: '$99.99',
    referenceNumber: 'TRX-123456789'
  };
  
  /**
   * Renders a template by replacing placeholders with actual values
   * 
   * @param {string} template - The template string containing placeholders
   * @param {Object} data - The data object containing values for placeholders
   * @returns {string} The rendered template with replaced placeholders
   */
  function renderTemplate(template, data) {
    if (!template) {
      return '';
    }
    
    // Replace all {{variableName}} placeholders with their values
    return template.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const value = data[variableName];
      return value !== undefined ? value : match; // Keep placeholder if value is not provided
    });
  }

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
 * Processes notification for a user based on their preferences
 * and prepares appropriate personalized templates
 * 
 * @param {string} email - The email address of the user
 * @param {string} notificationType - The type of notification (e.g., 'welcome', 'otp')
 * @param {Object} [dynamicData={}] - Dynamic data to populate the notification templates
 * @returns {Promise<Object>} A result object with details about the notification preparation
 */
async function processUserNotification(email, notificationType, dynamicData = {}) {
    // Get user notification channels
    const channelInfo = await getUserNotificationChannels(email, notificationType);
    
    if (!channelInfo.success) {
      console.log(`Cannot process notification: ${channelInfo.error}`);
      return {
        success: false,
        error: channelInfo.error,
        details: 'Failed to determine notification channels'
      };
    }
    
    const { channels, userData } = channelInfo;
    
    // If no channels are enabled, log and exit gracefully
    if (channels.length === 0) {
      console.log(`User ${email} has not opted in to receive ${notificationType} notifications on any channel`);
      return {
        success: false,
        error: 'No notification channels enabled for this notification type',
        channels: []
      };
    }
    
    // Prepare and render templates for enabled channels
    const templates = prepareNotificationTemplates(notificationType, channels, userData, dynamicData);
    
    // Check if we have at least one valid template
    const hasValidTemplates = Object.values(templates).some(template => template !== null);
    
    if (!hasValidTemplates) {
      console.log(`No valid templates found for ${notificationType} notification`);
      return {
        success: false,
        error: 'No valid templates found for this notification type',
        channels
      };
    }
    
    // Log success and return templates and channel info
    console.log(`Successfully prepared ${channels.join(', ')} personalized templates for ${email}`);
    
    return {
      success: true,
      message: `Personalized templates prepared successfully for ${channels.length} channel(s)`,
      channels,
      userData,
      notificationType,
      templates
    };
  }

/**
 * Sends personalized notifications to a user through their preferred channels
 * using mock services for demonstration purposes
 * 
 * @param {string} email - The email address of the user
 * @param {string} notificationType - The type of notification (e.g., 'welcome', 'otp')
 * @param {Object} [dynamicData={}] - Dynamic data to personalize the notification templates
 * @param {Object} [options={}] - Additional options for notification delivery
 * @returns {Promise<Object>} A result object with details about the notification attempts
 */
async function sendUserNotification(email, notificationType, dynamicData = {}, options = {}) {
    // Validate the input data to ensure proper personalization
    if (notificationType === 'otp' && !dynamicData.otpCode) {
      console.log('OTP notification requested without providing an otpCode');
      // Provide a random OTP code for testing if not supplied
      dynamicData.otpCode = dynamicData.otpCode || Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    // Process notification templates based on user preferences and personalize them
    const processResult = processUserNotification(email, notificationType, dynamicData);
    
    if (!processResult.success) {
      return processResult;
    }
    
    const { channels, userData, templates } = processResult;
    const results = { 
      success: false, 
      channels: [], 
      results: {},
      // Include template preview for debugging/visibility
      preview: {} 
    };
    
    // Send personalized email if enabled
    if (channels.includes('email') && templates.email) {
      try {
        const { subject, body } = templates.email;
        
        console.log(`Sending personalized ${notificationType} email to: ${email}`);
        console.log(`Email content: Subject: "${subject.substring(0, 30)}..."`);
        
        // Store preview for debugging/visibility
        results.preview.email = {
          subject,
          body: body.length > 100 ? `${body.substring(0, 100)}...` : body
        };
  
        // This would normally call the actual email service with personalized content
        // For now, we'll simulate using a mock service
        const mockEmailResult = {
          success: true,
          messageId: `mock-email-${Date.now()}`,
          timestamp: new Date().toISOString(),
          sentTo: email
        };
        
        results.results.email = {
          ...mockEmailResult,
          subject
        };
        
        console.log(`Successfully sent personalized ${notificationType} email to ${email} [MessageID: ${mockEmailResult.messageId}]`);
      } catch (error) {
        console.log(`Failed to send personalized email to ${email}:`, error);
        results.results.email = {
          success: false,
          error: error.message || 'Unknown error'
        };
      }
    }
    
    // Send personalized SMS if enabled
    if (channels.includes('sms') && templates.sms) {
      try {
        const { message } = templates.sms;
        
        console.log(`Sending personalized ${notificationType} SMS to: ${userData.phone}`);
        console.log(`SMS content: "${message.substring(0, 50)}..."`);
        
        // Store preview for debugging/visibility
        results.preview.sms = {
          message: message.length > 100 ? `${message.substring(0, 100)}...` : message
        };
        
        // This would normally call the actual SMS service with personalized content
        // For now, we'll simulate using a mock service
        const mockSmsResult = {
          success: true,
          messageId: `mock-sms-${Date.now()}`,
          timestamp: new Date().toISOString(),
          sentTo: userData.phone
        };
        
        results.results.sms = mockSmsResult;
        
        console.log(`Successfully sent personalized ${notificationType} SMS to ${userData.phone} [MessageID: ${mockSmsResult.messageId}]`);
      } catch (error) {
        console.log(`Failed to send personalized SMS to ${userData.phone}:`, error);
        results.results.sms = {
          success: false,
          error: error.message || 'Unknown error'
        };
      }
    }
    
    // Mark overall success if at least one channel succeeded
    results.success = Object.values(results.results).some(result => result.success);
    results.channels = channels;
    
    return results;
  }

/**
 * Prepares personalized notification templates for the specified channels based on user preferences
 * 
 * @param {string} notificationType - The type of notification (e.g., 'welcome', 'otp')
 * @param {Array} channels - Array of channels to prepare templates for
 * @param {Object} userData - User data including language preference
 * @param {Object} dynamicData - Dynamic data to personalize the templates with
 * @returns {Object} Object containing personalized templates for each channel
 */
function prepareNotificationTemplates(notificationType, channels, userData, dynamicData) {
    const templates = {};
    const language = userData.language || 'en';
    
    // Merge default test data with user data and provided dynamic data
    // This prioritizes dynamic data over user data over default data
    const templateData = {
      ...DEFAULT_TEST_DATA,
      // Use user data if available
      userName: userData.name || DEFAULT_TEST_DATA.userName,
      email: userData.email,
      phone: userData.phone,
      // Override with any dynamic data provided
      ...dynamicData
    };
    
    console.log(`Personalizing templates with data:`, { 
      notificationType,
      language,
      userName: templateData.userName,
      dynamicFields: Object.keys(dynamicData) 
    });
    
    // Check if email channel is enabled and prepare email template
    if (channels.includes('email')) {
      const emailTemplate = getTemplate('email', notificationType, language);
      
      if (!emailTemplate) {
        console.log(`Email template not found for ${notificationType} in ${language} language`);
        templates.email = null;
      } else {
        // Personalize the templates with the data
        const personalizedSubject = renderTemplate(emailTemplate.subject, templateData);
        const personalizedBody = renderTemplate(emailTemplate.body, templateData);
        
        templates.email = {
          subject: personalizedSubject,
          body: personalizedBody,
          originalSubject: emailTemplate.subject,
          originalBody: emailTemplate.body,
          data: templateData
        };
        
        console.log(`Prepared personalized email template for ${notificationType} notification in ${language}`);
      }
    }
    
    // Check if SMS channel is enabled and prepare SMS template
    if (channels.includes('sms')) {
      const smsTemplate = getTemplate('sms', notificationType, language);
      
      if (!smsTemplate) {
        console.log(`SMS template not found for ${notificationType} in ${language} language`);
        templates.sms = null;
      } else {
        // Personalize the SMS template with the data
        const personalizedMessage = renderTemplate(smsTemplate, templateData);
        
        templates.sms = {
          message: personalizedMessage,
          originalTemplate: smsTemplate,
          data: templateData
        };
        
        console.log(`Prepared personalized SMS template for ${notificationType} notification in ${language}`);
      }
    }
    
    return templates;
  }

module.exports = {
  getUserNotificationChannels,
  sendUserNotification,
  loadAndPersonalizeTemplates,
  prepareNotificationTemplates,
  renderTemplate
};