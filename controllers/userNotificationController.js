/**
 * Controller for determining user notification preferences and preparing personalized templates
 * @module userNotificationController
 */

const userPreferences = require('../user-preferences');
const { getTemplate } = require('../templateManager');
const emailMock = require('../notifications/emails');
const smsMock = require('../notifications/sms');

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
 * and prepares appropriate personalized templates with comprehensive error handling
 * 
 * @param {string} email - The email address of the user
 * @param {string} notificationType - The type of notification (e.g., 'welcome', 'otp')
 * @param {Object} [dynamicData={}] - Dynamic data to populate the notification templates
 * @returns {Promise<Object>} A result object with details about the notification preparation
 */
async function processUserNotification(email, notificationType, dynamicData = {}) {
    try {
      // Input validation
      if (!email) {
        const errorMsg = 'Email address is required for processing notification';
        console.log(errorMsg);
        return {
          success: false,
          error: errorMsg,
          errorCode: 'MISSING_EMAIL',
          details: 'Email address must be provided to identify the user'
        };
      }
      
      if (!notificationType) {
        const errorMsg = 'Notification type is required for processing notification';
        console.log(errorMsg);
        return {
          success: false,
          error: errorMsg,
          errorCode: 'MISSING_NOTIFICATION_TYPE',
          details: 'A valid notification type (e.g., otp, welcome) must be specified'
        };
      }
      
      // Get user notification channels
      let channelInfo;
      try {
        channelInfo = await getUserNotificationChannels(email, notificationType);
      } catch (error) {
        console.log(`Error fetching user notification channels: ${error.message}`, error);
        return {
          success: false,
          error: 'Failed to retrieve user notification preferences',
          errorCode: 'PREFERENCE_RETRIEVAL_ERROR',
          details: error.message,
          originalError: error
        };
      }
      
      if (!channelInfo.success) {
        console.log(`Cannot process notification: ${channelInfo.error}`);
        return {
          success: false,
          error: channelInfo.error,
          errorCode: channelInfo.errorCode || 'CHANNEL_INFO_ERROR',
          details: 'Failed to determine notification channels'
        };
      }
      
      const { channels, userData } = channelInfo;
      
      // If no channels are enabled, log and exit gracefully
      if (channels.length === 0) {
        const infoMsg = `User ${email} has not opted in to receive ${notificationType} notifications on any channel`;
        console.log(infoMsg);
        return {
          success: false,
          error: 'No notification channels enabled for this notification type',
          errorCode: 'NO_ENABLED_CHANNELS',
          details: infoMsg,
          channels: []
        };
      }
      
      // Prepare and render templates for enabled channels
      let templates;
      try {
        templates = prepareNotificationTemplates(notificationType, channels, userData, dynamicData);
      } catch (error) {
        console.log(`Error preparing templates for ${notificationType}: ${error.message}`, error);
        return {
          success: false,
          error: 'Failed to prepare notification templates',
          errorCode: 'TEMPLATE_PREPARATION_ERROR',
          details: error.message,
          originalError: error,
          channels
        };
      }
      
      // Check if we have at least one valid template
      const hasValidTemplates = Object.values(templates).some(template => template !== null);
      
      if (!hasValidTemplates) {
        const errorMsg = `No valid templates found for ${notificationType} notification`;
        console.log(errorMsg);
        return {
          success: false,
          error: 'No valid templates found for this notification type',
          errorCode: 'NO_VALID_TEMPLATES',
          details: errorMsg,
          channels
        };
      }
      
      // Check each template type
      channels.forEach(channel => {
        if (!templates[channel]) {
          console.log(`No ${channel} template available for ${notificationType} notification`);
        }
      });
      
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
    } catch (error) {
      // Catch any unexpected errors
      const errorMsg = `Unexpected error processing ${notificationType} notification for ${email}: ${error.message}`;
      console.log(errorMsg, error);
      return {
        success: false,
        error: 'Failed to process notification',
        errorCode: 'UNEXPECTED_ERROR',
        details: error.message,
        originalError: error
      };
    }
  }

/**
 * Sends personalized notifications to a user through their preferred channels
 * using mock services for demonstration purposes with robust error handling
 * 
 * @param {string} email - The email address of the user
 * @param {string} notificationType - The type of notification (e.g., 'welcome', 'otp')
 * @param {Object} [dynamicData={}] - Dynamic data to populate the notification templates
 * @returns {Promise<Object>} A result object with details about the notification attempts
 */
async function sendUserNotification(email, notificationType, dynamicData = {}) {
    try {
      // Validate required parameters
      if (!email) {
        console.log('Email address is required for sending notification');
        return {
          success: false,
          error: 'Email address is required',
          errorCode: 'MISSING_EMAIL',
          details: 'Email address must be provided to identify the recipient'
        };
      }
      
      if (!notificationType) {
        console.log('Notification type is required for sending notification');
        return {
          success: false,
          error: 'Notification type is required',
          errorCode: 'MISSING_NOTIFICATION_TYPE',
          details: 'A valid notification type (e.g., otp, welcome) must be specified'
        };
      }
      
      // Process and create personalized notification templates based on user preferences
      let processResult;
      try {
        processResult = await processUserNotification(email, notificationType, dynamicData);
      } catch (error) {
        console.log(`Error processing notification: ${error.message}`, error);
        return {
          success: false,
          error: 'Failed to process notification',
          errorCode: 'PROCESS_ERROR',
          details: error.message,
          originalError: error
        };
      }
      
      if (!processResult.success) {
        return {
          ...processResult,
          source: 'processUserNotification'
        };
      }
      
      const { channels, userData, templates } = processResult;
      const results = { 
        success: false, 
        channels: [],
        results: {},
        sentContent: {}, // Store snippets of the actual content sent
        errors: []       // Collection of all errors encountered
      };
      
      // Use mock services to send through enabled channels
      
      // Send email if enabled
      if (channels.includes('email')) {
        if (!templates.email) {
          const errorMsg = `Email template not available for ${notificationType} notification`;
          console.log(errorMsg);
          results.results.email = {
            success: false,
            error: 'Template not available',
            errorCode: 'MISSING_EMAIL_TEMPLATE',
            details: errorMsg,
            timestamp: new Date().toISOString()
          };
          results.errors.push({
            channel: 'email',
            error: 'Template not available',
            errorCode: 'MISSING_EMAIL_TEMPLATE'
          });
        } else if (!email || !validateEmailFormat(email)) {
          const errorMsg = `Invalid email address format: ${email}`;
          console.log(errorMsg);
          results.results.email = {
            success: false,
            error: 'Invalid email address',
            errorCode: 'INVALID_EMAIL_FORMAT',
            details: errorMsg,
            timestamp: new Date().toISOString()
          };
          results.errors.push({
            channel: 'email',
            error: 'Invalid email address',
            errorCode: 'INVALID_EMAIL_FORMAT'
          });
        } else {
          try {
            const fallbackInfo = templates.email.fallbackUsed 
              ? ` using fallback language (${templates.email.language})` 
              : '';
            
            console.log(`Sending personalized ${notificationType} email to: ${email}${fallbackInfo}`);
            
            try {
              // In a real implementation, we would call an actual email service here
              // For mock purposes, we'll log and simulate a successful send
              
              // This is where the actual email service would be called with the rendered templates
              // emailService.send({
              //   to: email,
              //   subject: templates.email.subject,
              //   body: templates.email.body,
              //   isHtml: false
              // });
              
              // Simulate possible dispatch errors (5% chance of failure for testing)
              if (Math.random() < 0.05) {
                throw new Error('Simulated email service temporary failure');
              }
              
              results.results.email = {
                success: true,
                messageId: `mock-email-${Date.now()}`,
                sentTo: email,
                subject: templates.email.subject,
                language: templates.email.language,
                fallbackUsed: templates.email.fallbackUsed,
                timestamp: new Date().toISOString()
              };
              
              // Store a preview of the rendered content
              results.sentContent.email = {
                subject: templates.email.subject,
                body: templates.email.body.substring(0, 100) + (templates.email.body.length > 100 ? '...' : ''),
                language: templates.email.language,
                fallbackUsed: templates.email.fallbackUsed
              };
              
              console.log(`Successfully sent personalized ${notificationType} email to ${email}${fallbackInfo}`);
            } catch (dispatchError) {
              // Handle errors specifically related to the dispatch process
              const errorMsg = `Email dispatch error: ${dispatchError.message}`;
              console.log(errorMsg, dispatchError);
              
              results.results.email = {
                success: false,
                error: 'Failed to dispatch email',
                errorCode: 'EMAIL_DISPATCH_ERROR',
                details: dispatchError.message,
                timestamp: new Date().toISOString()
              };
              
              results.errors.push({
                channel: 'email',
                error: 'Failed to dispatch email',
                errorCode: 'EMAIL_DISPATCH_ERROR',
                details: dispatchError.message
              });
            }
          } catch (error) {
            // Handle any other errors in the email sending process
            const errorMsg = `Unexpected error sending email to ${email}: ${error.message}`;
            console.log(errorMsg, error);
            
            results.results.email = {
              success: false,
              error: 'Email notification failed',
              errorCode: 'EMAIL_NOTIFICATION_ERROR',
              details: error.message,
              timestamp: new Date().toISOString()
            };
            
            results.errors.push({
              channel: 'email',
              error: 'Email notification failed',
              errorCode: 'EMAIL_NOTIFICATION_ERROR',
              details: error.message
            });
          }
        }
      }
      
      // Send SMS if enabled
      if (channels.includes('sms')) {
        if (!templates.sms) {
          const errorMsg = `SMS template not available for ${notificationType} notification`;
          console.log(errorMsg);
          results.results.sms = {
            success: false,
            error: 'Template not available',
            errorCode: 'MISSING_SMS_TEMPLATE',
            details: errorMsg,
            timestamp: new Date().toISOString()
          };
          results.errors.push({
            channel: 'sms',
            error: 'Template not available',
            errorCode: 'MISSING_SMS_TEMPLATE'
          });
        } else if (!userData.phone || !validatePhoneFormat(userData.phone)) {
          const errorMsg = `Invalid phone number format: ${userData.phone}`;
          console.log(errorMsg);
          results.results.sms = {
            success: false,
            error: 'Invalid phone number',
            errorCode: 'INVALID_PHONE_FORMAT',
            details: errorMsg,
            timestamp: new Date().toISOString()
          };
          results.errors.push({
            channel: 'sms',
            error: 'Invalid phone number',
            errorCode: 'INVALID_PHONE_FORMAT'
          });
        } else {
          try {
            const fallbackInfo = templates.sms.fallbackUsed 
              ? ` using fallback language (${templates.sms.language})` 
              : '';
              
            console.log(`Sending personalized ${notificationType} SMS to: ${userData.phone}${fallbackInfo}`);
            
            try {
              // In a real implementation, we would call an actual SMS service here
              // For mock purposes, we'll log and simulate a successful send
              
              // This is where the actual SMS service would be called with the rendered message
              // smsService.send({
              //   to: userData.phone,
              //   message: templates.sms.message
              // });
              
              // Simulate possible dispatch errors (5% chance of failure for testing)
              if (Math.random() < 0.05) {
                throw new Error('Simulated SMS service temporary failure');
              }
              
              results.results.sms = {
                success: true,
                messageId: `mock-sms-${Date.now()}`,
                sentTo: userData.phone,
                language: templates.sms.language,
                fallbackUsed: templates.sms.fallbackUsed,
                timestamp: new Date().toISOString()
              };
              
              // Store a preview of the rendered content
              results.sentContent.sms = {
                message: templates.sms.message.substring(0, 100) + (templates.sms.message.length > 100 ? '...' : ''),
                language: templates.sms.language,
                fallbackUsed: templates.sms.fallbackUsed
              };
              
              console.log(`Successfully sent personalized ${notificationType} SMS to ${userData.phone}${fallbackInfo}`);
            } catch (dispatchError) {
              // Handle errors specifically related to the dispatch process
              const errorMsg = `SMS dispatch error: ${dispatchError.message}`;
              console.log(errorMsg, dispatchError);
              
              results.results.sms = {
                success: false,
                error: 'Failed to dispatch SMS',
                errorCode: 'SMS_DISPATCH_ERROR',
                details: dispatchError.message,
                timestamp: new Date().toISOString()
              };
              
              results.errors.push({
                channel: 'sms',
                error: 'Failed to dispatch SMS',
                errorCode: 'SMS_DISPATCH_ERROR',
                details: dispatchError.message
              });
            }
          } catch (error) {
            // Handle any other errors in the SMS sending process
            const errorMsg = `Unexpected error sending SMS to ${userData.phone}: ${error.message}`;
            console.log(errorMsg, error);
            
            results.results.sms = {
              success: false,
              error: 'SMS notification failed',
              errorCode: 'SMS_NOTIFICATION_ERROR',
              details: error.message,
              timestamp: new Date().toISOString()
            };
            
            results.errors.push({
              channel: 'sms',
              error: 'SMS notification failed',
              errorCode: 'SMS_NOTIFICATION_ERROR',
              details: error.message
            });
          }
        }
      }
      
      // Mark overall success if at least one channel succeeded
      results.success = Object.values(results.results).some(result => result.success);
      results.channels = channels;
      results.attemptedChannels = Object.keys(results.results);
      results.successfulChannels = Object.entries(results.results)
        .filter(([_, result]) => result.success)
        .map(([channel, _]) => channel);
      
      // Include information about partial success
      if (results.success && results.errors.length > 0) {
        results.partialSuccess = true;
        results.partialSuccessDetails = `Successfully delivered to ${results.successfulChannels.length} of ${results.attemptedChannels.length} channels`;
      }
      
      return results;
    } catch (error) {
      // Catch any unexpected errors in the overall process
      const errorMsg = `Unexpected error in notification process for ${email}: ${error.message}`;
      console.log(errorMsg, error);
      
      return {
        success: false,
        error: 'Failed to process notification request',
        errorCode: 'NOTIFICATION_PROCESS_ERROR',
        details: error.message,
        originalError: error
      };
    }
  }
  
  /**
   * Validates email format
   * @param {string} email - Email address to validate
   * @returns {boolean} Whether email format is valid
   */
  function validateEmailFormat(email) {
    if (!email) return false;
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Validates phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Whether phone format is valid
   */
  function validatePhoneFormat(phone) {
    if (!phone) return false;
    // Basic phone validation - allows various formats with optional country code
    // This is simplified and should be replaced with a more robust solution in production
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
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
    
    // Default fallback language
  const DEFAULT_LANGUAGE = 'en';
  
  // Check if email channel is enabled and prepare email template
  if (channels.includes('email')) {
    // Try to get template in user's preferred language
    let emailTemplate = getTemplate('email', notificationType, language);
    let usedLanguage = language;
    let fallbackUsed = false;
    
    // If template not found in preferred language, fall back to English
    if (!emailTemplate && language !== DEFAULT_LANGUAGE) {
      console.log(`Email template not found for ${notificationType} in ${language} language, falling back to ${DEFAULT_LANGUAGE}`);
      emailTemplate = getTemplate('email', notificationType, DEFAULT_LANGUAGE);
      usedLanguage = DEFAULT_LANGUAGE;
      fallbackUsed = true;
    }
    
    if (!emailTemplate) {
      console.log(`Email template not found for ${notificationType} in any language`);
      templates.email = null;
    } else {
      // Render the subject and body templates with the personalized data
      const renderedSubject = renderTemplate(emailTemplate.subject, templateData);
      const renderedBody = renderTemplate(emailTemplate.body, templateData);
      
      templates.email = {
        subject: renderedSubject,
        body: renderedBody,
        originalTemplate: emailTemplate,
        language: usedLanguage,
        fallbackUsed,
        data: templateData
      };
      
      if (fallbackUsed) {
        console.log(`Used fallback ${DEFAULT_LANGUAGE} email template for ${notificationType} notification (user preferred ${language})`);
      } else {
        console.log(`Prepared personalized email template for ${notificationType} notification in ${usedLanguage}`);
      }
      
      console.log(`Email subject: "${renderedSubject.substring(0, 30)}..."`);
    }
  }
  
  // Check if SMS channel is enabled and prepare SMS template
  if (channels.includes('sms')) {
    // Try to get template in user's preferred language
    let smsTemplate = getTemplate('sms', notificationType, language);
    let usedLanguage = language;
    let fallbackUsed = false;
    
    // If template not found in preferred language, fall back to English
    if (!smsTemplate && language !== DEFAULT_LANGUAGE) {
      console.log(`SMS template not found for ${notificationType} in ${language} language, falling back to ${DEFAULT_LANGUAGE}`);
      smsTemplate = getTemplate('sms', notificationType, DEFAULT_LANGUAGE);
      usedLanguage = DEFAULT_LANGUAGE;
      fallbackUsed = true;
    }
    
    if (!smsTemplate) {
      console.log(`SMS template not found for ${notificationType} in any language`);
      templates.sms = null;
    } else {
      // Render the SMS template with the personalized data
      const renderedMessage = renderTemplate(smsTemplate, templateData);
      
      templates.sms = {
        message: renderedMessage,
        originalTemplate: smsTemplate,
        language: usedLanguage,
        fallbackUsed,
        data: templateData
      };
      
      if (fallbackUsed) {
        console.log(`Used fallback ${DEFAULT_LANGUAGE} SMS template for ${notificationType} notification (user preferred ${language})`);
      } else {
        console.log(`Prepared personalized SMS template for ${notificationType} notification in ${usedLanguage}`);
      }
      
      console.log(`SMS message (truncated): "${renderedMessage.substring(0, 30)}..."`);
    }
  }
    
    return templates;
  }

  /**
 * Generates a report about language usage and fallbacks for a notification result
 * 
 * @param {Object} result - The result object from sendUserNotification
 * @returns {Object} A report about language usage
 */
function getLanguageReport(result) {
    if (!result || !result.sentContent) {
      return {
        languagesUsed: [],
        fallbacksUsed: false,
        details: {}
      };
    }
  
    const report = {
      languagesUsed: [],
      fallbacksUsed: false,
      details: {}
    };
  
    // Check each channel for language info
    Object.entries(result.sentContent).forEach(([channel, content]) => {
      if (content.language) {
        // Add language to the list if not already there
        if (!report.languagesUsed.includes(content.language)) {
          report.languagesUsed.push(content.language);
        }
  
        // Track if fallback was used
        if (content.fallbackUsed) {
          report.fallbacksUsed = true;
        }
  
        // Add channel-specific details
        report.details[channel] = {
          language: content.language,
          fallbackUsed: content.fallbackUsed || false
        };
      }
    });
  
    return report;
  }

/**
 * Sends a notification to a user based on their communication preferences
 * 
 * @param {string} email - The email address of the user
 * @param {string} notificationType - The type of notification (e.g., 'welcome', 'otp')
 * @param {Object} [data={}] - Data to populate the notification templates
 * @param {Object} [options={}] - Additional options for notification delivery
 * @param {boolean} [options.forceSend=false] - If true, sends notification regardless of user preferences
 * @returns {Promise<Object>} An object containing the results of notification attempts
 */
const sendNotificationByPreference = async (email, notificationType, data = {}, options = {}) => {
    // Extract and default options
    const { forceSend = false, ...notifierOptions } = options;
  
    if (!email) {
      console.log('Email address is required');
      return {
        success: false,
        error: 'Email address is required',
        channels: [],
        preferencesOverridden: false
      };
    }
  
    if (!notificationType) {
      console.log('Notification type is required');
      return {
        success: false,
        error: 'Notification type is required',
        channels: [],
        preferencesOverridden: false
      };
    }
  
    // Get user preferences by email
    const userPrefs = await userPreferences.getUserPreferences(email);
    
    if (!userPrefs) {
      if (forceSend) {
        // If forceSend is true but we don't have user preferences, we'll create default ones
        console.log(`User preferences not found for ${email}, but forceSend is enabled. Using default preferences.`);
        const defaultPrefs = {
          name: email.split('@')[0], // Use username part as name
          language: 'en',
          emailEnabled: true,
          smsEnabled: false, // No phone number available
          notificationTypes: {
            [notificationType]: { email: true, sms: false }
          }
        };
        
        // Use default preferences for this notification
        return await processNotificationWithPreferences(email, notificationType, data, notifierOptions, defaultPrefs, true);
      }
      
      console.log(`User preferences not found for email: ${email}`);
      return {
        success: false,
        error: 'User preferences not found',
        channels: [],
        preferencesOverridden: false
      };
    }
  
    // Process with user preferences, potentially overriding them
    return await processNotificationWithPreferences(email, notificationType, data, notifierOptions, userPrefs, forceSend);
  };
  
  /**
   * Helper function to process notifications with given preferences
   * 
   * @private
   * @param {string} email - The email address of the user
   * @param {string} notificationType - The type of notification
   * @param {Object} data - Data to populate the notification templates
   * @param {Object} options - Additional options for notification delivery
   * @param {Object} userPrefs - User preferences object
   * @param {boolean} forceSend - Whether to override user preferences
   * @returns {Promise<Object>} Results of notification attempts
   */
  const processNotificationWithPreferences = async (email, notificationType, data, options, userPrefs, forceSend) => {
    // Determine which channels the user has opted in to (or all available if forceSend)
    const channels = [];
    const results = {
      success: false,
      channels: [],
      results: {},
      preferencesOverridden: false
    };
  
    // Check if we should use email channel
    const emailEnabled = forceSend || (userPrefs.emailEnabled && userPrefs.notificationTypes[notificationType]?.email);
    if (emailEnabled) {
      channels.push('email');
      // Track if we're overriding preferences
      if (forceSend && !(userPrefs.emailEnabled && userPrefs.notificationTypes[notificationType]?.email)) {
        results.preferencesOverridden = true;
      }
    }
  
    // Check if we should use SMS channel (only if phone is available)
    const smsEnabled = userPrefs.phone && (forceSend || (userPrefs.smsEnabled && userPrefs.notificationTypes[notificationType]?.sms));
    if (smsEnabled) {
      channels.push('sms');
      // Track if we're overriding preferences
      if (forceSend && !(userPrefs.smsEnabled && userPrefs.notificationTypes[notificationType]?.sms)) {
        results.preferencesOverridden = true;
      }
    }
  
    // If no channels are available even with forceSend, return early
    if (channels.length === 0) {
      if (forceSend) {
        console.log(`forceSend enabled, but no viable channels found for ${email} (missing contact info)`);
        return {
          success: false,
          error: 'No viable channels available, even with forceSend (missing contact info)',
          channels: [],
          preferencesOverridden: false
        };
      }
      
      console.log(`User ${email} has not opted in to receive ${notificationType} notifications on any channel`);
      return {
        success: false,
        error: 'No notification channels enabled for this notification type',
        channels: [],
        preferencesOverridden: false
      };
    }
  
    // Log if we're overriding preferences
    if (results.preferencesOverridden) {
      console.log(`Overriding user preferences for ${email} with forceSend option`);
    }
  
    // Send notifications through each channel
    for (const channel of channels) {
      try {
        if (channel === 'email') {
          // Get appropriate email template
          const template = getTemplate('email', notificationType, userPrefs.language || 'en');
          
          if (!template) {
            console.log(`No ${notificationType} template found for ${userPrefs.language} language`);
            results.results.email = { 
              success: false, 
              error: 'Template not found' 
            };
            continue;
          }
          
          // Send email using mock service
          const emailResult = await notifier.dispatch({
            type: 'email',
            recipient: email,
            subject: template.subject,
            message: template.body,
            data: {
              ...data,
              userName: userPrefs.name || 'Valued Customer'
            },
            options: {
              ...options,
              mockMode: true, // Using mock mode as requested
              preferencesOverridden: results.preferencesOverridden
            }
          });
          
          results.results.email = {
            success: !!emailResult.dispatched,
            messageId: emailResult.messageId || null,
            error: emailResult.error || null
          };
          
          const overriddenMsg = results.preferencesOverridden ? ' (preferences overridden)' : '';
          console.log(`Email ${notificationType} notification ${emailResult.dispatched ? 'sent' : 'failed'} to ${email}${overriddenMsg}`);
        } 
        
        else if (channel === 'sms') {
          // Get appropriate SMS template
          const template = getTemplate('sms', notificationType, userPrefs.language || 'en');
          
          if (!template) {
            console.log(`No ${notificationType} SMS template found for ${userPrefs.language} language`);
            results.results.sms = { 
              success: false, 
              error: 'Template not found' 
            };
            continue;
          }
          
          // Send SMS using mock service
          const smsResult = await notifier.dispatch({
            type: 'sms',
            recipient: userPrefs.phone,
            message: template,
            data: {
              ...data,
              userName: userPrefs.name || 'Valued Customer'
            },
            options: {
              ...options,
              mockMode: true, // Using mock mode as requested
              preferencesOverridden: results.preferencesOverridden
            }
          });
          
          results.results.sms = {
            success: !!smsResult.dispatched,
            messageId: smsResult.messageId || null,
            error: smsResult.error || null
          };
          
          const overriddenMsg = results.preferencesOverridden ? ' (preferences overridden)' : '';
          console.log(`SMS ${notificationType} notification ${smsResult.dispatched ? 'sent' : 'failed'} to ${userPrefs.phone}${overriddenMsg}`);
        }
      } catch (error) {
        console.log(`Error sending ${channel} notification to ${email}:`, error);
        results.results[channel] = {
          success: false,
          error: error.message || 'Unknown error'
        };
      }
    }
  
    // Mark overall success if at least one channel succeeded
    results.success = Object.values(results.results).some(result => result.success);
    results.channels = channels;
  
    return results;
  };
  
  /**
   * Sends notifications to multiple users in a single call
   * 
   * This function allows sending the same notification type to multiple users at once, 
   * processing each user's preferences independently and logging the results.
   * 
   * @param {string[]} emails - Array of email addresses for the notification recipients
   * @param {string} notificationType - The type of notification (e.g., 'welcome', 'otp')
   * @param {Object} [data={}] - Shared data to populate the notification templates
   * @param {Object} [options={}] - Additional options for notification delivery
   * @returns {Promise<Object>} A consolidated object containing results of all notification attempts
   */
  const sendBulkNotification = async (emails, notificationType, data = {}, options = {}) => {
    if (!Array.isArray(emails) || emails.length === 0) {
      console.log('Array of email addresses is required');
      return {
        success: false,
        error: 'Valid array of email addresses is required',
        totalUsers: 0,
        processed: 0,
        results: {}
      };
    }
  
    if (!notificationType) {
      console.log('Notification type is required');
      return {
        success: false,
        error: 'Notification type is required',
        totalUsers: emails.length,
        processed: 0,
        results: {}
      };
    }
  
    console.log(`Starting bulk notification of type "${notificationType}" to ${emails.length} users`);
    
    // Track the overall results
    const bulkResults = {
      success: false,
      totalUsers: emails.length,
      processed: 0,
      successful: 0,
      failed: 0,
      results: {}
    };
  
    // Process each user's notification independently
    for (const email of emails) {
      try {
        // Skip empty or invalid emails
        if (!email || typeof email !== 'string') {
          console.log('Skipping invalid email in bulk notification');
          bulkResults.results[String(email) || 'invalid'] = {
            success: false,
            error: 'Invalid email format',
            processed: false
          };
          bulkResults.failed++;
          continue;
        }
  
        console.log(`Processing notification for ${email} (${bulkResults.processed + 1}/${emails.length})`);
        
        // Process notification for this user based on their preferences
        const userResult = await sendNotificationByPreference(
          email, 
          notificationType,
          { ...data }, // Clone data object to avoid potential cross-user contamination
          options
        );
        
        // Store the result for this user
        bulkResults.results[email] = userResult;
        
        // Update counters
        bulkResults.processed++;
        if (userResult.success) {
          bulkResults.successful++;
        } else {
          bulkResults.failed++;
        }
        
        console.log(`Completed notification for ${email} - ${userResult.success ? 'Success' : 'Failed'}`);
        
      } catch (error) {
        // Handle any unexpected errors for this specific user
        console.log(`Unexpected error processing notification for ${email}:`, error);
        bulkResults.results[email] = {
          success: false,
          error: `Unexpected error: ${error.message}`,
          processed: true
        };
        bulkResults.processed++;
        bulkResults.failed++;
      }
    }
    
    // Mark the overall operation as successful if at least one notification was successfully sent
    bulkResults.success = bulkResults.successful > 0;
    
    // Calculate success rate
    bulkResults.successRate = bulkResults.totalUsers > 0 
      ? (bulkResults.successful / bulkResults.totalUsers * 100).toFixed(2) + '%' 
      : '0%';
    
    console.log(`Bulk notification completed. Success rate: ${bulkResults.successRate} (${bulkResults.successful}/${bulkResults.totalUsers})`);
    
    return bulkResults;
  };

/**
 * Sends the same notification to multiple users at once
 * 
 * This function accepts an array of email addresses and sends the same type
 * of notification to all users, processing each independently according to
 * their notification preferences.
 * 
 * @param {string[]} emails - Array of email addresses to send notifications to
 * @param {string} notificationType - The type of notification to send (e.g., 'welcome', 'otp')
 * @param {Object} [data={}] - Shared data to populate the notification templates
 * @param {Object} [options={}] - Additional options for notification delivery
 * @param {boolean} [options.failFast=false] - If true, stops processing on first failure
 * @param {boolean} [options.parallelSend=true] - If true, sends notifications in parallel
 * @param {boolean} [options.validateTemplatesFirst=true] - If true, validates templates before processing
 * @param {boolean} [options.forceSend=false] - If true, sends notification regardless of user preferences
 * @returns {Promise<Object>} Detailed results of the batch operation
 */
const sendBatchNotifications = async (emails, notificationType, data = {}, options = {}) => {
    // Validate inputs
    if (!Array.isArray(emails) || emails.length === 0) {
      console.log('Invalid or empty emails array provided to batch notification');
      return {
        success: false,
        error: 'An array of email addresses is required',
        processedCount: 0,
        statusCounts: { success: 0, skipped: 0, failed: 0 },
        results: []
      };
    }
  
    if (!notificationType) {
      console.log('Notification type is required for batch notification');
      return {
        success: false,
        error: 'Notification type is required',
        processedCount: 0,
        statusCounts: { success: 0, skipped: 0, failed: 0 },
        results: []
      };
    }
  
    // Extract and default batch-specific options
    const { 
      failFast = false, 
      parallelSend = true,
      validateTemplatesFirst = true,
      forceSend = false,
      ...notificationOptions 
    } = options;
  
    // Log if we're overriding preferences
    if (forceSend) {
      console.log(`Force send enabled for batch notification of type "${notificationType}" - user preferences will be overridden`);
    }
  
    // Pre-validate templates if requested
    if (validateTemplatesFirst) {
      console.log('Pre-validating templates for notification type:', notificationType);
      // Check if email template exists (using default language)
      const emailTemplate = getTemplate('email', notificationType, 'en');
      if (!emailTemplate) {
        console.log(`Email template not found for type '${notificationType}'`);
        return {
          success: false,
          error: `Email template not found for type '${notificationType}'`,
          processedCount: 0,
          statusCounts: { success: 0, skipped: 0, failed: emails.length },
          results: emails.map(email => ({
            email,
            status: 'failed',
            success: false,
            error: `Email template not found for type '${notificationType}'`,
            channels: []
          }))
        };
      }
      
      // Check if SMS template exists (using default language)
      const smsTemplate = getTemplate('sms', notificationType, 'en');
      if (!smsTemplate) {
        console.log(`SMS template not found for type '${notificationType}' - SMS notifications may be skipped`);
      }
    }
  
    console.log(`Starting batch notification of type "${notificationType}" to ${emails.length} recipients`);
    
    const startTime = Date.now();
    const statusCounts = {
      success: 0,
      skipped: 0,
      failed: 0,
      forced: 0  // Track how many were sent with overridden preferences
    };
    
    // Results container
    const results = [];
    
    try {
      // Process notifications in parallel or sequentially based on options
      if (parallelSend) {
        // Map each email to a notification promise and process all in parallel
        const notificationPromises = emails.map(async (email) => {
          try {
            // Check if email is valid before proceeding
            if (!email || typeof email !== 'string' || !email.includes('@')) {
              statusCounts.failed++;
              console.log(`Invalid email address format: ${email}`);
              return {
                email: email || 'invalid-email',
                status: 'failed',
                success: false,
                error: 'Invalid email address format',
                channels: [],
                preferencesOverridden: false
              };
            }
            
            // Pass the forceSend option to the individual notification function
            const result = await sendNotificationByPreference(
              email, 
              notificationType, 
              data, 
              {
                ...notificationOptions,
                forceSend
              }
            );
            
            // Determine the status based on the result
            let status;
            
            if (result.success) {
              status = 'success';
              
              // Track if this was a forced success
              if (result.preferencesOverridden) {
                statusCounts.forced++;
              }
              
              statusCounts.success++;
              console.log(`Successfully sent ${notificationType} notification to ${email}${result.preferencesOverridden ? ' (forced)' : ''}`);
            } else if (!forceSend && result.error === 'No notification channels enabled for this notification type') {
              status = 'skipped';
              statusCounts.skipped++;
              console.log(`User ${email} not opted-in for ${notificationType} notifications - skipped`);
            } else if (!forceSend && result.error === 'User preferences not found') {
              status = 'skipped';
              statusCounts.skipped++;
              console.log(`User preferences not found for ${email} - skipped`);
            } else if (result.results && Object.values(result.results).some(r => r.error === 'Template not found')) {
              status = 'failed';
              statusCounts.failed++;
              console.log(`Template not found for ${notificationType} notification to ${email}`);
            } else if (result.error && result.error.includes('missing contact info')) {
              // This catches the case where forceSend is true but there's no viable channel
              status = 'failed';
              statusCounts.failed++;
              console.log(`Cannot send to ${email}: ${result.error}`);
            } else {
              status = 'failed';
              statusCounts.failed++;
              console.log(`Failed to send ${notificationType} notification to ${email}: ${result.error || 'Unknown error'}`);
            }
            
            // Return the enhanced user result
            return {
              email,
              status,
              ...result
            };
          } catch (error) {
            statusCounts.failed++;
            console.log(`Exception while processing notification for ${email}:`, error);
            return {
              email,
              status: 'failed',
              success: false,
              error: error.message || 'Unknown error',
              channels: [],
              preferencesOverridden: false
            };
          }
        });
        
        // Await all notification promises
        const batchResults = await Promise.all(notificationPromises);
        results.push(...batchResults);
      } else {
        // Process sequentially
        for (const email of emails) {
          try {
            // Check if email is valid before proceeding
            if (!email || typeof email !== 'string' || !email.includes('@')) {
              statusCounts.failed++;
              console.log(`Invalid email address format: ${email}`);
              
              const userResult = {
                email: email || 'invalid-email',
                status: 'failed',
                success: false,
                error: 'Invalid email address format',
                channels: [],
                preferencesOverridden: false
              };
              
              results.push(userResult);
              
              if (failFast) {
                console.log(`Stopping batch processing due to failFast option after invalid email: ${email}`);
                break;
              }
              
              continue;
            }
            
            // Pass the forceSend option to the individual notification function
            const result = await sendNotificationByPreference(
              email, 
              notificationType, 
              data, 
              {
                ...notificationOptions,
                forceSend
              }
            );
            
            // Determine the status based on the result
            let status;
            
            if (result.success) {
              status = 'success';
              
              // Track if this was a forced success
              if (result.preferencesOverridden) {
                statusCounts.forced++;
              }
              
              statusCounts.success++;
              console.log(`Successfully sent ${notificationType} notification to ${email}${result.preferencesOverridden ? ' (forced)' : ''}`);
            } else if (!forceSend && result.error === 'No notification channels enabled for this notification type') {
              status = 'skipped';
              statusCounts.skipped++;
              console.log(`User ${email} not opted-in for ${notificationType} notifications - skipped`);
            } else if (!forceSend && result.error === 'User preferences not found') {
              status = 'skipped';
              statusCounts.skipped++;
              console.log(`User preferences not found for ${email} - skipped`);
            } else if (result.results && Object.values(result.results).some(r => r.error === 'Template not found')) {
              status = 'failed';
              statusCounts.failed++;
              console.log(`Template not found for ${notificationType} notification to ${email}`);
            } else if (result.error && result.error.includes('missing contact info')) {
              // This catches the case where forceSend is true but there's no viable channel
              status = 'failed';
              statusCounts.failed++;
              console.log(`Cannot send to ${email}: ${result.error}`);
            } else {
              status = 'failed';
              statusCounts.failed++;
              console.log(`Failed to send ${notificationType} notification to ${email}: ${result.error || 'Unknown error'}`);
            }
            
            // Add the enhanced user result
            const userResult = {
              email,
              status,
              ...result
            };
            
            results.push(userResult);
            
            // Stop processing if failFast is enabled and we had a failure
            if (failFast && status === 'failed') {
              console.log(`Stopping batch processing due to failFast option after failure for ${email}`);
              break;
            }
          } catch (error) {
            statusCounts.failed++;
            
            const userResult = {
              email,
              status: 'failed',
              success: false,
              error: error.message || 'Unknown error',
              channels: [],
              preferencesOverridden: false
            };
            
            results.push(userResult);
            
            console.log(`Exception while processing notification for ${email}:`, error);
            
            // Stop processing if failFast is enabled
            if (failFast) {
              console.log(`Stopping batch processing due to failFast option after exception for ${email}`);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.log(`Unexpected error in batch notification process:`, error);
      return {
        success: false,
        error: `Batch processing error: ${error.message || 'Unknown error'}`,
        processedCount: statusCounts.success + statusCounts.skipped + statusCounts.failed,
        statusCounts,
        results
      };
    }
    
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000; // in seconds
    
    const forcedMsg = statusCounts.forced > 0 ? ` (${statusCounts.forced} with overridden preferences)` : '';
    
    console.log(
      `Batch notification complete: ${statusCounts.success} succeeded${forcedMsg}, ` +
      `${statusCounts.skipped} skipped, ${statusCounts.failed} failed, took ${processingTime.toFixed(2)}s`
    );
    
    return {
      success: statusCounts.success > 0,
      processedCount: statusCounts.success + statusCounts.skipped + statusCounts.failed,
      statusCounts,
      processingTimeSeconds: processingTime,
      results
    };
  };
  

module.exports = {
  getUserNotificationChannels,
  sendUserNotification,
  loadAndPersonalizeTemplates,
  prepareNotificationTemplates,
  renderTemplate,
  getLanguageReport,
  validateEmailFormat,
  validatePhoneFormat,
  sendNotificationByPreference,
  sendBulkNotification,
  sendBatchNotifications
};