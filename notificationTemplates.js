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
 * @param {string} template - The template string containing placeholders like {{key}}
 * @param {object} data - An object containing key-value pairs for replacement
 * @param {boolean} [logWarnings=true] - Whether to log warnings for missing values
 * @returns {string} The rendered template with all placeholders replaced
 */
function renderTemplate(template, data, logWarnings = true) {
    // Start with the original template
    let renderedTemplate = template;
    
    // Check if inputs are valid
    if (typeof template !== 'string' || !data || typeof data !== 'object') {
      throw new Error('Invalid arguments: template must be a string and data must be an object');
    }
    
    // Find all placeholders in the template
    const placeholderRegex = /{{([^{}]+)}}/g;
    const placeholders = new Set();
    let match;
    
    // Extract all placeholders from the template
    while ((match = placeholderRegex.exec(template)) !== null) {
      placeholders.add(match[1]);
    }
    
    // Replace each placeholder with its corresponding value from the data object
    for (const key in data) {
      // Only process properties directly on the object (not from prototype)
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Create a regex to find all instances of the placeholder
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        
        // Convert value to string (in case it's a number or other type)
        const value = data[key] !== null && data[key] !== undefined ? String(data[key]) : '';
        
        // Replace all occurrences of the placeholder with the value
        renderedTemplate = renderedTemplate.replace(placeholder, value);
        
        // Remove this key from the placeholders set as it's been handled
        placeholders.delete(key);
      }
    }
    
    // Log warnings for any placeholders that weren't replaced
    if (logWarnings && placeholders.size > 0) {
      placeholders.forEach(key => {
        console.warn(`Warning: No value provided for placeholder '${key}' in template`);
      });
    }
    
    // Return the rendered template (which may still contain some unreplaced placeholders)
    return renderedTemplate;
  }

  module.exports = {
    notificationTemplates,
    renderTemplate
    };
