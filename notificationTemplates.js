/**
 * Multi-language notification templates
 * Templates organized by channel type, template name, language code, and template content
 * Each template uses {{placeholder}} format for dynamic content
 */
const notificationTemplates = {
    email: {
      welcome: {
        en: {
          subject: "Welcome to {{serviceName}}!",
          body: "Hello {{userName}},\n\nWelcome to {{serviceName}}! We're excited to have you join us.\n\nTo get started, please verify your email by clicking on the link below:\n{{verificationLink}}\n\nIf you have any questions, feel free to contact our support team at {{supportEmail}}.\n\nBest regards,\nThe {{serviceName}} Team"
        },
        es: {
          subject: "¡Bienvenido a {{serviceName}}!",
          body: "Hola {{userName}},\n\n¡Bienvenido a {{serviceName}}! Estamos emocionados de que te unas a nosotros.\n\nPara comenzar, verifica tu correo electrónico haciendo clic en el enlace a continuación:\n{{verificationLink}}\n\nSi tienes alguna pregunta, no dudes en contactar a nuestro equipo de soporte en {{supportEmail}}.\n\nSaludos cordiales,\nEl Equipo de {{serviceName}}"
        },
        fr: {
          subject: "Bienvenue sur {{serviceName}} !",
          body: "Bonjour {{userName}},\n\nBienvenue sur {{serviceName}} ! Nous sommes ravis de vous compter parmi nous.\n\nPour commencer, veuillez vérifier votre e-mail en cliquant sur le lien ci-dessous :\n{{verificationLink}}\n\nSi vous avez des questions, n'hésitez pas à contacter notre équipe d'assistance à {{supportEmail}}.\n\nCordialement,\nL'équipe {{serviceName}}"
        }
      },
      passwordReset: {
        en: {
          subject: "Password Reset Request for {{serviceName}}",
          body: "Hello {{userName}},\n\nWe received a request to reset your password for your {{serviceName}} account.\n\nPlease click the link below to reset your password:\n{{resetLink}}\n\nThis link will expire in {{expiryTime}} hours.\n\nIf you didn't request this, you can safely ignore this email.\n\nBest regards,\nThe {{serviceName}} Team"
        },
        es: {
          subject: "Solicitud de restablecimiento de contraseña para {{serviceName}}",
          body: "Hola {{userName}},\n\nHemos recibido una solicitud para restablecer la contraseña de tu cuenta en {{serviceName}}.\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n{{resetLink}}\n\nEste enlace caducará en {{expiryTime}} horas.\n\nSi no solicitaste esto, puedes ignorar este correo electrónico.\n\nSaludos cordiales,\nEl Equipo de {{serviceName}}"
        },
        fr: {
          subject: "Demande de réinitialisation de mot de passe pour {{serviceName}}",
          body: "Bonjour {{userName}},\n\nNous avons reçu une demande de réinitialisation de mot de passe pour votre compte {{serviceName}}.\n\nVeuillez cliquer sur le lien ci-dessous pour réinitialiser votre mot de passe :\n{{resetLink}}\n\nCe lien expirera dans {{expiryTime}} heures.\n\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.\n\nCordialement,\nL'équipe {{serviceName}}"
        }
      },
      orderConfirmation: {
        en: {
          subject: "Order Confirmation #{{orderNumber}}",
          body: "Hello {{userName}},\n\nThank you for your order!\n\nOrder Number: {{orderNumber}}\nOrder Date: {{orderDate}}\nTotal Amount: {{orderTotal}}\n\nShipping Address:\n{{shippingAddress}}\n\nEstimated Delivery Date: {{estimatedDelivery}}\n\nOrder Details:\n{{orderDetails}}\n\nIf you have any questions about your order, please contact us at {{supportEmail}}.\n\nThank you for shopping with {{serviceName}}!\n\nBest regards,\nThe {{serviceName}} Team"
        },
        es: {
          subject: "Confirmación de Pedido #{{orderNumber}}",
          body: "Hola {{userName}},\n\n¡Gracias por tu pedido!\n\nNúmero de Pedido: {{orderNumber}}\nFecha de Pedido: {{orderDate}}\nImporte Total: {{orderTotal}}\n\nDirección de Envío:\n{{shippingAddress}}\n\nFecha Estimada de Entrega: {{estimatedDelivery}}\n\nDetalles del Pedido:\n{{orderDetails}}\n\nSi tienes alguna pregunta sobre tu pedido, contáctanos en {{supportEmail}}.\n\n¡Gracias por comprar con {{serviceName}}!\n\nSaludos cordiales,\nEl Equipo de {{serviceName}}"
        },
        fr: {
          subject: "Confirmation de commande #{{orderNumber}}",
          body: "Bonjour {{userName}},\n\nNous vous remercions pour votre commande !\n\nNuméro de commande : {{orderNumber}}\nDate de la commande : {{orderDate}}\nMontant total : {{orderTotal}}\n\nAdresse de livraison :\n{{shippingAddress}}\n\nDate de livraison estimée : {{estimatedDelivery}}\n\nDétails de la commande :\n{{orderDetails}}\n\nSi vous avez des questions concernant votre commande, veuillez nous contacter à {{supportEmail}}.\n\nMerci d'avoir fait vos achats avec {{serviceName}} !\n\nCordialement,\nL'équipe {{serviceName}}"
        }
      }
    },
    sms: {
      welcome: {
        en: "Welcome to {{serviceName}}, {{userName}}! Your account has been created successfully. Reply HELP for assistance.",
        es: "¡Bienvenido a {{serviceName}}, {{userName}}! Tu cuenta ha sido creada con éxito. Responde AYUDA para obtener asistencia.",
        fr: "Bienvenue sur {{serviceName}}, {{userName}} ! Votre compte a été créé avec succès. Répondez AIDE pour obtenir de l'assistance."
      },
      verification: {
        en: "Your {{serviceName}} verification code is {{verificationCode}}. This code will expire in {{expiryTime}} minutes.",
        es: "Tu código de verificación de {{serviceName}} es {{verificationCode}}. Este código caducará en {{expiryTime}} minutos.",
        fr: "Votre code de vérification {{serviceName}} est {{verificationCode}}. Ce code expirera dans {{expiryTime}} minutes."
      },
      orderUpdate: {
        en: "{{serviceName}} Order #{{orderNumber}} update: {{updateMessage}}. Track your order at {{trackingLink}}",
        es: "Actualización del pedido #{{orderNumber}} de {{serviceName}}: {{updateMessage}}. Sigue tu pedido en {{trackingLink}}",
        fr: "Mise à jour de la commande {{serviceName}} #{{orderNumber}} : {{updateMessage}}. Suivez votre commande sur {{trackingLink}}"
      },
      appointmentReminder: {
        en: "Reminder: You have an appointment scheduled for {{appointmentDate}} at {{appointmentTime}}. Reply C to confirm or R to reschedule.",
        es: "Recordatorio: Tienes una cita programada para el {{appointmentDate}} a las {{appointmentTime}}. Responde C para confirmar o R para reprogramar.",
        fr: "Rappel : Vous avez un rendez-vous prévu le {{appointmentDate}} à {{appointmentTime}}. Répondez C pour confirmer ou R pour reprogrammer."
      }
    }
  };
  
/**
 * Renders a template by language, replacing placeholders with values from a data object
 * 
 * @param {Object} templates - The templates object containing multi-language templates
 * @param {string} channel - The notification channel ('email' or 'sms')
 * @param {string} templateName - The name of the template to use
 * @param {string} language - The language code to use (e.g., 'en', 'es', 'fr', 'de')
 * @param {Object} data - An object containing key-value pairs for replacement
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.logWarnings=true] - Whether to log warning messages
 * @param {boolean} [options.returnEmptyOnMissing=false] - Whether to return empty string instead of throwing error on missing template
 * @param {string} [options.fallbackLanguage='en'] - Primary fallback language code
 * @returns {string|Object|null} The rendered template with all placeholders replaced
 */
function renderTemplateByLanguage(templates, channel, templateName, language, data, options = {}) {
    // Default options
    const {
      logWarnings = true,
      returnEmptyOnMissing = false,
      fallbackLanguage = 'en'
    } = options;
    
    // Check if inputs are valid
    if (!templates || !channel || !templateName || !language || !data) {
      throw new Error('Missing required parameters');
    }
    
    // Check if the channel exists
    if (!templates[channel]) {
      const errorMsg = `Channel "${channel}" not found in templates`;
      if (logWarnings) {
        console.warn(`Warning: ${errorMsg}`);
      }
      if (returnEmptyOnMissing) {
        return null;
      }
      throw new Error(errorMsg);
    }
    
    // Check if the template exists
    if (!templates[channel][templateName]) {
      const errorMsg = `Template "${templateName}" not found in channel "${channel}"`;
      if (logWarnings) {
        console.warn(`Warning: ${errorMsg}`);
      }
      if (returnEmptyOnMissing) {
        return null;
      }
      throw new Error(errorMsg);
    }
    
    // Try to find the template in the following order:
    // 1. Requested language
    // 2. Fallback language (usually 'en')
    // 3. Any available language (first one found)
    
    let template = null;
    let usedLanguage = null;
    
    // 1. Check requested language
    if (templates[channel][templateName][language]) {
      template = templates[channel][templateName][language];
      usedLanguage = language;
    }
    // 2. Check fallback language
    else if (language !== fallbackLanguage && templates[channel][templateName][fallbackLanguage]) {
      template = templates[channel][templateName][fallbackLanguage];
      usedLanguage = fallbackLanguage;
      if (logWarnings) {
        console.warn(`Warning: Template "${templateName}" not available in language "${language}". Falling back to "${fallbackLanguage}".`);
      }
    }
    // 3. Use any available language as last resort
    else {
      const availableLanguages = Object.keys(templates[channel][templateName]);
      if (availableLanguages.length > 0) {
        usedLanguage = availableLanguages[0];
        template = templates[channel][templateName][usedLanguage];
        if (logWarnings) {
          console.warn(`Warning: Template "${templateName}" not available in language "${language}" or fallback "${fallbackLanguage}". Using "${usedLanguage}" as last resort.`);
        }
      } else {
        const errorMsg = `No language versions found for template "${templateName}" in channel "${channel}"`;
        if (logWarnings) {
          console.warn(`Warning: ${errorMsg}`);
        }
        if (returnEmptyOnMissing) {
          return null;
        }
        throw new Error(errorMsg);
      }
    }
    
    // If the template is an object (like email with subject and body)
    if (typeof template === 'object') {
      const result = {};
      // Render each property of the template object
      for (const key in template) {
        if (Object.prototype.hasOwnProperty.call(template, key)) {
          result[key] = renderTemplate(template[key], data, logWarnings);
        }
      }
      return result;
    }
    
    // If the template is a string (like SMS)
    return renderTemplate(template, data, logWarnings);
  }
  
  /**
   * Renders a template string by replacing placeholders with values
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
    
    // Return the rendered template
    return renderedTemplate;
  }
  
  /**
   * Gets a template in the specified language, falling back to English if the requested
   * language is not available
   * 
   * @param {object} templates - The template object containing language-specific templates
   * @param {string} language - The language code (e.g., 'en', 'es', 'fr')
   * @returns {object|string} The template in the requested language or English as fallback
   */
  function getLocalizedTemplate(templates, language) {
    // If the requested language exists, use it
    if (templates[language]) {
      return templates[language];
    }
    
    // Otherwise, fall back to English
    if (templates['en']) {
      console.warn(`Language '${language}' not found, using English as fallback`);
      return templates['en'];
    }
    
    // If even English doesn't exist, use the first available language
    const availableLanguage = Object.keys(templates)[0];
    console.warn(`Neither requested language '${language}' nor English found, using '${availableLanguage}' as fallback`);
    return templates[availableLanguage];
  }

  /**
 * Sends a notification using the appropriate template and language
 * 
 * @param {string} channel - The notification channel ('email' or 'sms')
 * @param {string} templateName - The name of the template to use
 * @param {string} language - The preferred language code 
 * @param {object} data - Data for template personalization
 * @returns {object|string} The rendered notification
 */
function sendNotificationWithTemplate(channel, templateName, language, data) {
    // Validate inputs
    if (!notificationTemplates[channel]) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    
    if (!notificationTemplates[channel][templateName]) {
      throw new Error(`Template not found: ${templateName}`);
    }
    
    // Get the template in the user's preferred language (with fallback)
    const template = getLocalizedTemplate(notificationTemplates[channel][templateName], language);
    
    // For email templates, render both subject and body
    if (channel === 'email' && typeof template === 'object') {
      return {
        subject: renderTemplate(template.subject, data),
        body: renderTemplate(template.body, data)
      };
    }
    
    // For SMS or other simple templates, just render the string
    return renderTemplate(template, data);
  }

  module.exports = {
    notificationTemplates,
    renderTemplate,
    getLocalizedTemplate,
    sendNotificationWithTemplate,
    renderTemplateByLanguage
    };
