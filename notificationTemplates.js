const notificationTemplates = {
    email: {
      welcome: {
        subject: "Welcome to {{serviceName}}!",
        body: "Hello {{userName}},\n\nWelcome to {{serviceName}}! We're excited to have you join us.\n\nTo get started, please verify your email by clicking on the link below:\n{{verificationLink}}\n\nIf you have any questions, feel free to contact our support team at {{supportEmail}}.\n\nBest regards,\nThe {{serviceName}} Team"
      },
      passwordReset: {
        subject: "Password Reset Request for {{serviceName}}",
        body: "Hello {{userName}},\n\nWe received a request to reset your password for your {{serviceName}} account.\n\nPlease click the link below to reset your password:\n{{resetLink}}\n\nThis link will expire in {{expiryTime}} hours.\n\nIf you didn't request this, you can safely ignore this email.\n\nBest regards,\nThe {{serviceName}} Team"
      },
      orderConfirmation: {
        subject: "Order Confirmation #{{orderNumber}}",
        body: "Hello {{userName}},\n\nThank you for your order!\n\nOrder Number: {{orderNumber}}\nOrder Date: {{orderDate}}\nTotal Amount: {{orderTotal}}\n\nShipping Address:\n{{shippingAddress}}\n\nEstimated Delivery Date: {{estimatedDelivery}}\n\nOrder Details:\n{{orderDetails}}\n\nIf you have any questions about your order, please contact us at {{supportEmail}}.\n\nThank you for shopping with {{serviceName}}!\n\nBest regards,\nThe {{serviceName}} Team"
      },
      paymentReminder: {
        subject: "Payment Reminder for {{serviceName}}",
        body: "Hello {{userName}},\n\nThis is a friendly reminder that your payment of {{amount}} for {{serviceName}} is due on {{dueDate}}.\n\nTo make a payment, please visit your account at {{paymentLink}}.\n\nIf you've already made this payment, please disregard this message.\n\nThank you for your business!\n\nBest regards,\nThe {{serviceName}} Team"
      },
      accountUpdate: {
        subject: "Your {{serviceName}} Account Has Been Updated",
        body: "Hello {{userName}},\n\nThis email confirms that your {{serviceName}} account has been updated:\n\nChange: {{changeType}}\nDate: {{changeDate}}\n\nIf you did not make this change, please contact our support team immediately at {{supportEmail}}.\n\nBest regards,\nThe {{serviceName}} Team"
      }
    },
    sms: {
      welcome: "Welcome to {{serviceName}}, {{userName}}! Your account has been created successfully. Reply HELP for assistance.",
      verification: "Your {{serviceName}} verification code is {{verificationCode}}. This code will expire in {{expiryTime}} minutes.",
      orderUpdate: "{{serviceName}} Order #{{orderNumber}} update: {{updateMessage}}. Track your order at {{trackingLink}}",
      appointmentReminder: "Reminder: You have an appointment scheduled for {{appointmentDate}} at {{appointmentTime}}. Reply C to confirm or R to reschedule.",
      paymentConfirmation: "Your payment of {{amount}} to {{serviceName}} has been processed successfully. Reference: {{referenceNumber}}",
      loginAlert: "New login detected on your {{serviceName}} account from {{deviceInfo}} at {{loginTime}}. If this wasn't you, please reset your password immediately.",
      promotionAlert: "{{promotionMessage}} Use code {{promoCode}} to get {{discountAmount}} off your next purchase at {{serviceName}}. Valid until {{expiryDate}}."
    }
  };
  
  /**
 * Renders a template string by replacing placeholders with values from a data object
 * 
 * @param {string} template - The template string containing placeholders in {{key}} format
 * @param {Object} data - Object with keys matching the placeholder names and values to replace them with
 * @param {Object} [options] - Optional configuration object
 * @param {boolean} [options.keepMissingPlaceholders=false] - If true, placeholders without matching data will be left as is
 * @returns {string} The rendered template with all placeholders replaced
 */
function renderTemplate(template, data, options = {}) {
    // Default options
    const { keepMissingPlaceholders = false } = options;
    
    // If template is not a string or data is not an object, return the original template
    if (typeof template !== 'string' || !data || typeof data !== 'object') {
      return template;
    }
  
    // Create a copy of the template string to modify
    let renderedTemplate = template;
    
    // Use a regular expression to find all {{placeholder}} patterns
    const placeholderPattern = /{{([^{}]+)}}/g;
    
    // Replace each placeholder with its corresponding value from the data object
    renderedTemplate = renderedTemplate.replace(placeholderPattern, (match, placeholderKey) => {
      // Trim any whitespace from the placeholder key
      const key = placeholderKey.trim();
      
      // Check if the key exists in the data object
      if (key in data) {
        // If the value is null or undefined, return an empty string
        return data[key] === null || data[key] === undefined ? '' : String(data[key]);
      }
      
      // If keepMissingPlaceholders is true, return the original placeholder
      // Otherwise, return an empty string
      return keepMissingPlaceholders ? match : '';
    });
    
    return renderedTemplate;
  }

  module.exports = {
    notificationTemplates,
    renderTemplate
    };
