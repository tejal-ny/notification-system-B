/**
 * Template Utility Module
 * 
 * Provides functions to retrieve and render templates based on type,
 * template name, and language preferences.
 * 
 * Version 2.0: Added support for default values for placeholders
 */

// Template store organized by type -> name -> language
const templates = {
    email: {
      welcome: {
        en: {
          subject: "Welcome to {{serviceName}}!",
          body: "Hello {{userName}},\n\nWelcome to {{serviceName}}! We're excited to have you join us.\n\nTo get started, please verify your email by clicking on the link below:\n{{verificationLink}}\n\nIf you have any questions, feel free to contact our support team at {{supportEmail}}.\n\nBest regards,\nThe {{serviceName}} Team"
        },
        es: {
          subject: "¡Bienvenido a {{serviceName}}!",
          body: "Hola {{userName}},\n\n¡Bienvenido a {{serviceName}}! Estamos emocionados de que te unas a nosotros.\n\nPara comenzar, verifica tu correo electrónico haciendo clic en el siguiente enlace:\n{{verificationLink}}\n\nSi tienes alguna pregunta, no dudes en contactar a nuestro equipo de soporte en {{supportEmail}}.\n\nSaludos cordiales,\nEl Equipo de {{serviceName}}"
        },
        fr: {
          subject: "Bienvenue sur {{serviceName}} !",
          body: "Bonjour {{userName}},\n\nBienvenue sur {{serviceName}} ! Nous sommes ravis de vous compter parmi nous.\n\nPour commencer, veuillez vérifier votre email en cliquant sur le lien ci-dessous :\n{{verificationLink}}\n\nSi vous avez des questions, n'hésitez pas à contacter notre équipe d'assistance à {{supportEmail}}.\n\nCordialement,\nL'équipe {{serviceName}}"
        }
      },
      // Other email templates...
    },
    sms: {
      // SMS templates...
    }
  };
  
  // Default language to use if the requested language is not available
  const DEFAULT_LANGUAGE = 'en';
  
  /**
   * Global default values for template placeholders
   * These will be used when a value is not provided in the data object
   */
  const DEFAULT_VALUES = {
    // User information defaults
    userName: 'Guest',
    userEmail: 'Not provided',
    userFirstName: 'User',
    userLastName: '',
    
    // Company/service defaults
    serviceName: 'Our Service',
    companyName: 'Our Company',
    supportEmail: 'support@example.com',
    supportPhone: 'Contact Support',
    
    // Common defaults
    verificationLink: '#verification-link#',
    resetLink: '#reset-link#',
    loginLink: '#login-link#',
    
    // Time-related defaults
    expiryTime: '24',
    appointmentDate: 'your scheduled date',
    appointmentTime: 'the scheduled time',
    
    // Security-related defaults
    otpCode: '#code#',
    
    // Payment-related defaults
    amount: 'your payment',
    referenceNumber: 'N/A'
  };
  
  /**
   * Get a template based on type, name, and language
   * 
   * This function retrieves the appropriate template from the template store.
   * If the template is not available in the requested language, it tries to find
   * the best match based on the language fallback chain or falls back to the default language.
   * 
   * @param {string} type - The template type (e.g., 'email', 'sms')
   * @param {string} name - The template name (e.g., 'welcome', 'otp')
   * @param {string|string[]} language - The language code(s) (e.g., 'en', 'es', ['es-MX', 'es', 'en'])
   * @param {Object} [options] - Additional options for template retrieval
   * @param {boolean} [options.strictMode=false] - If true, returns null instead of falling back to another language
   * @param {boolean} [options.includeMetadata=false] - If true, includes metadata about the template retrieval
   * @returns {Object|string|null} The template content, metadata object, or null if not found
   */
  function getTemplate(type, name, language, options = {}) {
    // Implementation remains the same...
    const { strictMode = false, includeMetadata = false } = options;
    
    // Input validation
    if (!type || !name) {
      console.error('Template type and name are required');
      return null;
    }
  
    // Convert single language string to array for consistent processing
    const languagePreferences = Array.isArray(language) 
      ? language 
      : language ? [language] : [DEFAULT_LANGUAGE];
    
    // Normalize language codes
    const normalizedLanguages = languagePreferences.map(lang => lang.toLowerCase());
    
    // Create metadata object if requested
    const metadata = includeMetadata ? {
      type,
      name,
      requestedLanguages: [...normalizedLanguages],
      selectedLanguage: null,
      fallbackUsed: false,
      strictMode,
      timestamp: new Date().toISOString()
    } : null;
  
    try {
      // Check if the template type exists
      if (!templates[type]) {
        console.warn(`Template type '${type}' not found`);
        return null;
      }
  
      // Check if the template name exists for this type
      if (!templates[type][name]) {
        console.warn(`Template name '${name}' not found for type '${type}'`);
        return null;
      }
  
      // Try each language in the preference order
      let template = null;
      let selectedLanguage = null;
  
      for (const lang of normalizedLanguages) {
        if (templates[type][name][lang]) {
          template = templates[type][name][lang];
          selectedLanguage = lang;
          break;
        }
      }
  
      // If no template found in preferred languages and not in strict mode,
      // fall back to default language
      if (!template && !strictMode && !normalizedLanguages.includes(DEFAULT_LANGUAGE)) {
        console.info(`Template '${type}.${name}' not available in preferred languages, falling back to '${DEFAULT_LANGUAGE}'`);
        template = templates[type][name][DEFAULT_LANGUAGE];
        selectedLanguage = DEFAULT_LANGUAGE;
  
        if (metadata) {
          metadata.fallbackUsed = true;
        }
      }
  
      // Update metadata if requested
      if (metadata && template) {
        metadata.selectedLanguage = selectedLanguage;
        // Return the template along with metadata
        return { template, metadata };
      }
  
      return template || null;
    } catch (error) {
      console.error(`Error retrieving template '${type}.${name}' with languages [${normalizedLanguages.join(', ')}]:`, error);
      return null;
    }
  }
  
  /**
   * Render a template by replacing placeholders with actual values
   *
   * @param {string|Object} template - The template string or object with template properties
   * @param {Object} data - The data to use for rendering
   * @param {Object} [options] - Additional options for template rendering
   * @param {boolean} [options.preserveMetadata=false] - If true, the metadata object is preserved in the returned object
   * @param {Object} [options.defaultValues] - Custom default values for this specific template rendering
   * @param {boolean} [options.keepMissingPlaceholders=false] - If true, placeholders with no value are left unchanged
   * @returns {string|Object} The rendered template
   */
  function renderTemplate(template, data = {}, options = {}) {
    const { 
      preserveMetadata = false,
      defaultValues = {},
      keepMissingPlaceholders = false 
    } = options;
    
    // No template to render
    if (!template) return null;
    
    // If the template includes metadata from getTemplate() with includeMetadata option
    if (template && template.metadata && template.template) {
      const renderedTemplate = renderTemplateContent(template.template, data, { defaultValues, keepMissingPlaceholders });
      return preserveMetadata ? { template: renderedTemplate, metadata: template.metadata } : renderedTemplate;
    }
    
    // Regular template rendering
    return renderTemplateContent(template, data, { defaultValues, keepMissingPlaceholders });
  }
  
  /**
   * Internal helper to render template content with placeholders
   * 
   * @param {string|Object} template - The template string or object with template properties
   * @param {Object} data - The data to use for rendering
   * @param {Object} [options] - Additional options for rendering
   * @returns {string|Object} The rendered template
   * @private
   */
  function renderTemplateContent(template, data, options = {}) {
    // Handle different template types
    if (typeof template === 'string') {
      // Simple string template
      return renderString(template, data, options);
    } else if (typeof template === 'object') {
      // Object with multiple string properties (e.g., email with subject and body)
      const rendered = {};
      
      Object.keys(template).forEach(key => {
        if (typeof template[key] === 'string') {
          rendered[key] = renderString(template[key], data, options);
        } else {
          rendered[key] = template[key];
        }
      });
      
      return rendered;
    }
    
    // Return unmodified if not a string or object
    return template;
  }
  
  /**
   * Render a string by replacing placeholders with values
   * 
   * @param {string} str - The template string
   * @param {Object} data - The data object with values
   * @param {Object} [options] - Additional options for rendering
   * @param {Object} [options.defaultValues] - Custom default values for this specific render
   * @param {boolean} [options.keepMissingPlaceholders=false] - If true, placeholders with no value are left unchanged
   * @returns {string} The rendered string
   * @private
   */
  function renderString(str, data, options = {}) {
    if (typeof str !== 'string') return str;
    
    const { 
      defaultValues = {},
      keepMissingPlaceholders = false
    } = options;
    
    let result = str;
    
    // Find all placeholders in the template
    const placeholderRegex = /{{([^{}]+)}}/g;
    const placeholders = [];
    let match;
    
    while ((match = placeholderRegex.exec(str)) !== null) {
      placeholders.push(match[1]);
    }
    
    // Process each placeholder found in the template
    const uniquePlaceholders = [...new Set(placeholders)];
    
    uniquePlaceholders.forEach(placeholder => {
      // Value resolution prioritizes:
      // 1. Value from provided data
      // 2. Value from function-specific defaultValues
      // 3. Value from global DEFAULT_VALUES
      // 4. Leave placeholder unchanged if keepMissingPlaceholders is true, otherwise empty string
      
      if (data && data[placeholder] !== undefined && data[placeholder] !== null) {
        // Use the provided value
        const regex = new RegExp(`{{${placeholder}}}`, 'g');
        result = result.replace(regex, data[placeholder]);
      } else if (defaultValues && defaultValues[placeholder] !== undefined) {
        // Use the function-specific default
        const regex = new RegExp(`{{${placeholder}}}`, 'g');
        result = result.replace(regex, defaultValues[placeholder]);
      } else if (DEFAULT_VALUES[placeholder] !== undefined) {
        // Use the global default
        const regex = new RegExp(`{{${placeholder}}}`, 'g');
        result = result.replace(regex, DEFAULT_VALUES[placeholder]);
      } else if (!keepMissingPlaceholders) {
        // Replace with empty string if not keeping missing placeholders
        const regex = new RegExp(`{{${placeholder}}}`, 'g');
        result = result.replace(regex, '');
      }
      // Otherwise, leave the placeholder as is
    });
    
    return result;
  }
  
  // Other functions remain the same...
  function listAvailableTemplates(type) { /* ... */ }
  function templateExists(type, name, language) { /* ... */ }
  function addTemplate(type, name, language, templateContent) { /* ... */ }
  
  /**
   * Get the default value for a placeholder
   * 
   * @param {string} placeholder - The placeholder name
   * @param {Object} [customDefaults] - Custom default values to check first
   * @returns {string|null} The default value or null if not found
   */
  function getDefaultValue(placeholder, customDefaults = {}) {
    if (customDefaults && customDefaults[placeholder] !== undefined) {
      return customDefaults[placeholder];
    }
    
    return DEFAULT_VALUES[placeholder] !== undefined ? DEFAULT_VALUES[placeholder] : null;
  }
  
  /**
   * Add or update global default values
   * 
   * @param {Object} newDefaults - Object containing new default values to add/update
   * @returns {boolean} True if the defaults were successfully updated
   */
  function updateDefaultValues(newDefaults) {
    if (!newDefaults || typeof newDefaults !== 'object') {
      console.error('New defaults must be provided as an object');
      return false;
    }
    
    try {
      Object.assign(DEFAULT_VALUES, newDefaults);
      return true;
    } catch (error) {
      console.error('Error updating default values:', error);
      return false;
    }
  }
  
  // Export the functions
  module.exports = {
    getTemplate,
    renderTemplate,
    listAvailableTemplates,
    templateExists,
    addTemplate,
    getDefaultValue,
    updateDefaultValues,
    // Export constants
    DEFAULT_LANGUAGE,
    DEFAULT_VALUES
  };