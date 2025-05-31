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
//   function listAvailableTemplates(type) { /* ... */ }
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

/**
 * Get all templates for a specific notification type
 * 
 * This function retrieves all templates for the specified notification type (e.g., 'email' or 'sms')
 * and optionally filters them by language. It returns the actual template content rather than just metadata,
 * making it easy to work with all templates of a specific type.
 *
 * @param {string} type - The notification type to retrieve templates for ('email', 'sms', etc.)
 * @param {string|string[]} [language] - Optional language(s) to filter by
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.includeMetadata=false] - Whether to include metadata with each template
 * @param {boolean} [options.structuredFormat=false] - If true, returns templates in a nested structure
 * @returns {Object} Object containing all templates of the specified type
 */
function getTemplatesByType(type, language, options = {}) {
    const { includeMetadata = false, structuredFormat = false } = options;
    
    // Input validation
    if (!type) {
      console.error('Notification type is required');
      return structuredFormat ? {} : [];
    }
    
    // If templates of this type don't exist
    if (!templates[type]) {
      console.warn(`No templates found for type '${type}'`);
      return structuredFormat ? {} : [];
    }
    
    // Normalize language preferences for filtering
    const languagePreferences = language ? (Array.isArray(language) 
      ? language.map(lang => lang.toLowerCase())
      : [language.toLowerCase()]) 
      : null;
  
    try {
      // Get all template names for this type
      const templateNames = Object.keys(templates[type]);
      
      // Return in structured format (nested by template name and language)
      if (structuredFormat) {
        const result = {};
        
        templateNames.forEach(templateName => {
          // Get available languages for this template
          const availableLanguages = Object.keys(templates[type][templateName]);
          
          // Filter languages if specified
          const filteredLanguages = languagePreferences 
            ? availableLanguages.filter(lang => languagePreferences.includes(lang))
            : availableLanguages;
            
          // Skip if no matching languages
          if (filteredLanguages.length === 0) return;
          
          // Add to structured result
          result[templateName] = {};
          
          filteredLanguages.forEach(lang => {
            const template = templates[type][templateName][lang];
            
            if (includeMetadata) {
              result[templateName][lang] = {
                template,
                metadata: {
                  type,
                  name: templateName,
                  language: lang,
                  isDefault: lang === DEFAULT_LANGUAGE
                }
              };
            } else {
              result[templateName][lang] = template;
            }
          });
        });
        
        return result;
      } 
      // Return in flat format (array of templates with metadata)
      else {
        const result = [];
        
        templateNames.forEach(templateName => {
          // Get available languages for this template
          const availableLanguages = Object.keys(templates[type][templateName]);
          
          // Filter languages if specified
          const filteredLanguages = languagePreferences 
            ? availableLanguages.filter(lang => languagePreferences.includes(lang))
            : availableLanguages;
          
          // Add each template to the result array
          filteredLanguages.forEach(lang => {
            const template = templates[type][templateName][lang];
            
            if (includeMetadata) {
              result.push({
                type,
                name: templateName,
                language: lang,
                isDefault: lang === DEFAULT_LANGUAGE,
                template
              });
            } else {
              result.push({
                name: templateName,
                language: lang,
                template
              });
            }
          });
        });
        
        return result;
      }
    } catch (error) {
      console.error(`Error retrieving templates for type '${type}':`, error);
      return structuredFormat ? {} : [];
    }
  }
  
  /**
   * List all available templates, optionally filtered by type
   * 
   * @param {string} [type] - Optional template type to filter by
   * @returns {Array} Array of available templates with their metadata
   */
  function listAvailableTemplates(type) {
    try {
      const result = [];
      
      // Determine which types to process
      const typesToProcess = type ? [type] : Object.keys(templates);
      
      // Collect template information
      typesToProcess.forEach(templateType => {
        if (!templates[templateType]) return;
        
        const templateNames = Object.keys(templates[templateType]);
        
        templateNames.forEach(templateName => {
          const languages = Object.keys(templates[templateType][templateName]);
          
          result.push({
            type: templateType,
            name: templateName,
            availableLanguages: languages,
            defaultLanguage: languages.includes(DEFAULT_LANGUAGE) ? DEFAULT_LANGUAGE : languages[0]
          });
        });
      });
      
      return result;
    } catch (error) {
      console.error('Error listing templates:', error);
      return [];
    }
  }

  /**
 * Get all templates available in a specific language
 * 
 * This function scans the entire template registry and returns all templates
 * that are available in the specified language. Useful for checking language
 * coverage and finding gaps in internationalization.
 * 
 * @param {string} language - The language code to search for (e.g., 'en', 'es', 'fr')
 * @param {Object} [options] - Additional options for filtering and output formatting
 * @param {boolean} [options.includeContent=false] - Whether to include the actual template content
 * @param {boolean} [options.groupByType=true] - If true, organizes results by notification type
 * @param {boolean} [options.includeMetadata=true] - Whether to include template metadata
 * @returns {Object|Array} The templates available in the specified language
 */
function getTemplatesByLanguage(language, options = {}) {
    const {
      includeContent = false,
      groupByType = true,
      includeMetadata = true
    } = options;
  
    // Input validation
    if (!language) {
      console.error('Language code is required');
      return groupByType ? {} : [];
    }
  
    // Normalize language code
    const normalizedLanguage = language.toLowerCase();
    
    try {
      // Initialize results structure based on grouping preference
      const result = groupByType ? {} : [];
      let totalTemplatesFound = 0;
      
      // Iterate through all template types
      Object.keys(templates).forEach(type => {
        const templateNames = Object.keys(templates[type]);
        
        // Initialize type group if grouping by type
        if (groupByType) {
          result[type] = {};
        }
        
        // Check each template for the requested language
        templateNames.forEach(name => {
          // Check if this template is available in the requested language
          if (templates[type][name][normalizedLanguage]) {
            totalTemplatesFound++;
            
            // Create template metadata
            const templateInfo = {
              type,
              name,
              language: normalizedLanguage
            };
            
            // Add additional metadata if requested
            if (includeMetadata) {
              // Add info about which other languages this template is available in
              templateInfo.availableLanguages = Object.keys(templates[type][name]);
              
              // Check if this is a complete template (available in all languages)
              const allLanguages = new Set();
              Object.values(templates).forEach(templateType => {
                Object.values(templateType).forEach(templateLangs => {
                  Object.keys(templateLangs).forEach(lang => allLanguages.add(lang));
                });
              });
              templateInfo.isComplete = templateInfo.availableLanguages.length === allLanguages.size;
              
              // Compare with default language version - useful for translation verification
              if (normalizedLanguage !== DEFAULT_LANGUAGE && 
                  templates[type][name][DEFAULT_LANGUAGE]) {
                const defaultTemplate = templates[type][name][DEFAULT_LANGUAGE];
                
                // For complex templates (like email with subject/body), check structure
                if (typeof defaultTemplate === 'object' && 
                    typeof templates[type][name][normalizedLanguage] === 'object') {
                  const defaultKeys = Object.keys(defaultTemplate);
                  const translatedKeys = Object.keys(templates[type][name][normalizedLanguage]);
                  templateInfo.hasAllFields = defaultKeys.every(key => translatedKeys.includes(key));
                }
              }
            }
            
            // Add content if requested
            if (includeContent) {
              templateInfo.content = templates[type][name][normalizedLanguage];
            }
            
            // Add to results based on grouping preference
            if (groupByType) {
              result[type][name] = templateInfo;
            } else {
              result.push(templateInfo);
            }
          }
        });
        
        // Remove empty type groups
        if (groupByType && Object.keys(result[type]).length === 0) {
          delete result[type];
        }
      });
      
      // Add summary information to the result
      const summary = {
        language: normalizedLanguage,
        totalTemplatesFound,
        coverage: {}
      };
      
      // Calculate coverage percentages by type
      Object.keys(templates).forEach(type => {
        const totalTemplatesOfType = Object.keys(templates[type]).length;
        const availableTemplatesOfType = groupByType && result[type] ? 
          Object.keys(result[type]).length : 
          (groupByType ? 0 : result.filter(t => t.type === type).length);
        
        summary.coverage[type] = {
          available: availableTemplatesOfType,
          total: totalTemplatesOfType,
          percentage: Math.round((availableTemplatesOfType / totalTemplatesOfType) * 100)
        };
      });
      
      // Return the results with summary information
      return {
        templates: result,
        summary
      };
    } catch (error) {
      console.error(`Error retrieving templates for language '${language}':`, error);
      return {
        templates: groupByType ? {} : [],
        summary: {
          language: normalizedLanguage,
          totalTemplatesFound: 0,
          error: error.message
        }
      };
    }
  }
  
  /**
   * Get list of languages with template availability statistics
   * 
   * @param {Object} [options] - Options for filtering and output
   * @param {string} [options.type] - Filter by template type
   * @returns {Array} List of languages with availability statistics
   */
  function getAvailableLanguages(options = {}) {
    const { type = null } = options;
    
    try {
      const availableLanguages = new Set();
      const languageStats = {};
      
      // Collect all existing languages
      Object.keys(templates).forEach(templateType => {
        // Skip if not the requested type
        if (type && type !== templateType) {
          return;
        }
        
        Object.values(templates[templateType]).forEach(templateVersions => {
          Object.keys(templateVersions).forEach(language => {
            // Add to set of available languages
            availableLanguages.add(language);
            
            // Initialize stats object if not exists
            if (!languageStats[language]) {
              languageStats[language] = {
                total: 0,
                byType: {}
              };
            }
            
            // Initialize type counter if not exists
            if (!languageStats[language].byType[templateType]) {
              languageStats[language].byType[templateType] = 0;
            }
            
            // Increment counters
            languageStats[language].total++;
            languageStats[language].byType[templateType]++;
          });
        });
      });
      
      // Convert to array and compute coverage percentages
      const result = Array.from(availableLanguages).map(language => {
        const stats = languageStats[language];
        const coverage = {};
        let totalTemplates = 0;
        let totalAvailable = 0;
        
        // Calculate coverage for each type
        Object.keys(templates).forEach(templateType => {
          // Skip if not the requested type
          if (type && type !== templateType) {
            return;
          }
          
          const totalOfType = Object.keys(templates[templateType]).length;
          const availableOfType = stats.byType[templateType] || 0;
          
          coverage[templateType] = {
            available: availableOfType,
            total: totalOfType,
            percentage: Math.round((availableOfType / totalOfType) * 100)
          };
          
          totalTemplates += totalOfType;
          totalAvailable += availableOfType;
        });
        
        // Add overall coverage percentage
        const overallPercentage = Math.round((totalAvailable / totalTemplates) * 100);
        
        return {
          code: language,
          isDefault: language === DEFAULT_LANGUAGE,
          totalTemplates: stats.total,
          coverage,
          overallCoverage: {
            available: totalAvailable,
            total: totalTemplates,
            percentage: overallPercentage
          }
        };
      });
      
      // Sort by overall coverage percentage (descending)
      result.sort((a, b) => {
        // Default language always first
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        
        // Then sort by coverage percentage
        return b.overallCoverage.percentage - a.overallCoverage.percentage;
      });
      
      return result;
    } catch (error) {
      console.error('Error getting available languages:', error);
      return [];
    }
  }
  
  /**
   * Find missing translations across all templates
   * 
   * @param {Object} [options] - Options for filtering 
   * @param {string} [options.type] - Filter by template type
   * @param {string} [options.language] - Focus on a specific language (compared to default language)
   * @returns {Array} List of templates with missing translations
   */
  function findMissingTranslations(options = {}) {
    const { type = null, language = null } = options;
    const result = [];
    
    try {
      // Get the list of all available languages
      const languages = [];
      
      // If a specific language is requested, only check that one
      if (language) {
        languages.push(language.toLowerCase());
      } else {
        // Otherwise, get all languages across all templates
        const allLanguages = new Set();
        
        Object.keys(templates).forEach(templateType => {
          // Skip if type filter is provided and doesn't match
          if (type && type !== templateType) return;
          
          Object.values(templates[templateType]).forEach(templateVersions => {
            Object.keys(templateVersions).forEach(lang => {
              allLanguages.add(lang);
            });
          });
        });
        
        // Convert Set to Array
        allLanguages.forEach(lang => {
          // Skip the default language
          if (lang !== DEFAULT_LANGUAGE) {
            languages.push(lang);
          }
        });
      }
      
      // Check each template type
      Object.keys(templates).forEach(templateType => {
        // Skip if type filter is provided and doesn't match
        if (type && type !== templateType) return;
        
        // Check each template in this type
        Object.keys(templates[templateType]).forEach(templateName => {
          // Skip if the template doesn't exist in the default language
          if (!templates[templateType][templateName][DEFAULT_LANGUAGE]) return;
          
          // Check for missing translations in each required language
          languages.forEach(lang => {
            if (!templates[templateType][templateName][lang]) {
              // This translation is missing
              result.push({
                type: templateType,
                name: templateName,
                missingLanguage: lang,
                status: 'missing'
              });
            } else if (typeof templates[templateType][templateName][DEFAULT_LANGUAGE] === 'object' &&
                       typeof templates[templateType][templateName][lang] === 'object') {
              // Check if all fields exist in complex templates
              const defaultFields = Object.keys(templates[templateType][templateName][DEFAULT_LANGUAGE]);
              const translatedFields = Object.keys(templates[templateType][templateName][lang]);
              
              const missingFields = defaultFields.filter(field => !translatedFields.includes(field));
              
              if (missingFields.length > 0) {
                result.push({
                  type: templateType,
                  name: templateName,
                  language: lang,
                  status: 'incomplete',
                  missingFields,
                  defaultFields,
                  completionPercentage: Math.round((translatedFields.length / defaultFields.length) * 100)
                });
              }
            }
          });
        });
      });
      
      // Organize the results by language or template type
      return result;
    } catch (error) {
      console.error('Error finding missing translations:', error);
      return [];
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
    DEFAULT_VALUES,
    getTemplatesByType,
    getTemplatesByLanguage,
    getAvailableLanguages,
    findMissingTranslations
  };