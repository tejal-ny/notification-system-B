/**
 * templateManager.js
 * 
 * Template management utility for the notification system. This module handles
 * storing and retrieving templates for different notification types (email, SMS)
 * in various languages. It provides a unified API for getting templates based on 
 * type, name, and preferred language with fallback capabilities.
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Create a logger instance for the template manager
// const console.log logger.createTypedLogger('template');

// Configuration
const DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE || 'en';
const TEMPLATES_DIR = process.env.TEMPLATES_DIR || path.join(__dirname, 'data', 'templates');
const MEMORY_CACHE_ENABLED = process.env.TEMPLATE_CACHE_ENABLED !== 'false';

// In-memory template cache for better performance
let templateCache = {};
let cacheInitialized = false;

/**
 * Ensure the templates directory exists
 */
function ensureTemplatesDirectory() {
  try {
    // Make sure the base templates directory exists
    if (!fs.existsSync(TEMPLATES_DIR)) {
      fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
      console.log(`Created templates directory: ${TEMPLATES_DIR}`);
    }
    
    // Make sure type subdirectories exist (email, sms)
    ['email', 'sms'].forEach(type => {
      const typeDir = path.join(TEMPLATES_DIR, type);
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
        console.log(`Created ${type} templates directory: ${typeDir}`);
      }
      
      // Make sure language subdirectories exist under each type
      ['en', 'es', 'fr'].forEach(lang => {
        const langDir = path.join(typeDir, lang);
        if (!fs.existsSync(langDir)) {
          fs.mkdirSync(langDir, { recursive: true });
          console.log(`Created ${lang} language directory for ${type}: ${langDir}`);
        }
      });
    });
    
    return true;
  } catch (error) {
    console.log('Failed to create templates directory structure:', error);
    return false;
  }
}

/**
 * Initialize the template cache by loading all templates into memory
 */
function initializeTemplateCache() {
  if (cacheInitialized) return true;
  
  try {
    // Ensure the templates directory structure exists
    ensureTemplatesDirectory();
    
    // Clear existing cache
    templateCache = {
      email: {},
      sms: {}
    };
    
    // Load templates from disk into memory cache
    ['email', 'sms'].forEach(type => {
      const typeDir = path.join(TEMPLATES_DIR, type);
      
      // Skip if type directory doesn't exist
      if (!fs.existsSync(typeDir)) return;
      
      // Get all language directories
      fs.readdirSync(typeDir).forEach(lang => {
        const langDir = path.join(typeDir, lang);
        
        // Skip if not a directory
        if (!fs.statSync(langDir).isDirectory()) return;
        
        // Get all template files in this language
        fs.readdirSync(langDir).forEach(fileName => {
          // Skip non-JSON files
          if (!fileName.endsWith('.json')) return;
          
          // Get template name (file name without .json extension)
          const templateName = fileName.replace('.json', '');
          
          // Load the template
          try {
            const templatePath = path.join(langDir, fileName);
            const templateContent = fs.readFileSync(templatePath, 'utf8');
            const template = JSON.parse(templateContent);
            
            // Initialize template category if needed
            if (!templateCache[type][templateName]) {
              templateCache[type][templateName] = {};
            }
            
            // Store template in cache
            templateCache[type][templateName][lang] = template;
            
            console.log(`Loaded ${type}.${templateName}.${lang} template from ${templatePath}`);
          } catch (err) {
            console.log(`Failed to load template ${type}.${templateName}.${lang}:`, err);
          }
        });
      });
    });
    
    // Add built-in templates if we don't have any in the cache
    if (Object.keys(templateCache.email).length === 0) {
      loadBuiltInTemplates();
    }
    
    cacheInitialized = true;
    console.log('Template cache initialized successfully');
    return true;
  } catch (error) {
    console.log('Failed to initialize template cache:', error);
    return false;
  }
}

/**
 * Load built-in templates into the cache and save them to disk
 */
function loadBuiltInTemplates() {
  // Built-in templates
  const builtInTemplates = {
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
      otp: {
        en: {
          subject: "Your {{serviceName}} Verification Code",
          body: "Hello {{userName}},\n\nYour verification code for {{serviceName}} is: {{otpCode}}\n\nThis code will expire in {{expiryTime}} minutes.\n\nIf you did not request this code, please ignore this email.\n\nBest regards,\nThe {{serviceName}} Team"
        },
        es: {
          subject: "Tu código de verificación de {{serviceName}}",
          body: "Hola {{userName}},\n\nTu código de verificación para {{serviceName}} es: {{otpCode}}\n\nEste código caducará en {{expiryTime}} minutos.\n\nSi no solicitaste este código, ignora este correo electrónico.\n\nSaludos cordiales,\nEl Equipo de {{serviceName}}"
        },
        fr: {
          subject: "Votre code de vérification {{serviceName}}",
          body: "Bonjour {{userName}},\n\nVotre code de vérification pour {{serviceName}} est : {{otpCode}}\n\nCe code expirera dans {{expiryTime}} minutes.\n\nSi vous n'avez pas demandé ce code, veuillez ignorer cet email.\n\nCordialement,\nL'équipe {{serviceName}}"
        }
      },
      passwordReset: {
        en: {
          subject: "Password Reset Request for {{serviceName}}",
          body: "Hello {{userName}},\n\nWe received a request to reset your password for your {{serviceName}} account.\n\nPlease click the link below to reset your password:\n{{resetLink}}\n\nThis link will expire in {{expiryTime}} hours.\n\nIf you didn't request this, you can safely ignore this email.\n\nBest regards,\nThe {{serviceName}} Team"
        }
      }
    },
    sms: {
      welcome: {
        en: "Welcome to {{serviceName}}, {{userName}}! Your account has been created successfully. Reply HELP for assistance.",
        es: "¡Bienvenido a {{serviceName}}, {{userName}}! Tu cuenta ha sido creada exitosamente. Responde AYUDA para obtener asistencia.",
        fr: "Bienvenue sur {{serviceName}}, {{userName}} ! Votre compte a été créé avec succès. Répondez AIDE pour obtenir de l'assistance."
      },
      otp: {
        en: "Your {{serviceName}} verification code is {{otpCode}}. This code will expire in {{expiryTime}} minutes.",
        es: "Tu código de verificación de {{serviceName}} es {{otpCode}}. Este código caducará en {{expiryTime}} minutos.",
        fr: "Votre code de vérification {{serviceName}} est {{otpCode}}. Ce code expirera dans {{expiryTime}} minutes."
      }
    }
  };
  
  // Add built-in templates to the cache
  templateCache = builtInTemplates;
  
  // Save built-in templates to disk
  Object.keys(builtInTemplates).forEach(type => {
    Object.keys(builtInTemplates[type]).forEach(name => {
      Object.keys(builtInTemplates[type][name]).forEach(lang => {
        const template = builtInTemplates[type][name][lang];
        saveTemplate(type, name, lang, template);
      });
    });
  });
}

/**
 * Save a template to disk
 * 
 * @param {string} type - The template type (e.g., 'email', 'sms')
 * @param {string} name - The template name
 * @param {string} language - The language code (e.g., 'en', 'es', 'fr')
 * @param {Object|string} template - The template content
 * @returns {boolean} Whether the save was successful
 */
function saveTemplate(type, name, language, template) {
  try {
    // Ensure all directories exist
    ensureTemplatesDirectory();
    
    // Create template directory for this language if needed
    const langDir = path.join(TEMPLATES_DIR, type, language);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }
    
    // Save template to file
    const templatePath = path.join(langDir, `${name}.json`);
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2), 'utf8');
    console.log(`Saved ${type}.${name}.${language} template to ${templatePath}`);
    
    // Update cache if enabled
    if (MEMORY_CACHE_ENABLED) {
      if (!templateCache[type]) templateCache[type] = {};
      if (!templateCache[type][name]) templateCache[type][name] = {};
      templateCache[type][name][language] = template;
    }
    
    return true;
  } catch (error) {
    console.log(`Failed to save template ${type}.${name}.${language}:`, error);
    return false;
  }
}

/**
 * Get a template based on type, name, and language
 * 
 * This function retrieves the appropriate template from the template store.
 * If the template is not available in the requested language, it falls back
 * to the default language (English).
 * 
 * @param {string} type - The template type (e.g., 'email', 'sms')
 * @param {string} name - The template name (e.g., 'welcome', 'otp')
 * @param {string} language - The language code (e.g., 'en', 'es', 'fr')
 * @returns {Object|string|null} The template content or null if not found
 */
function getTemplate(type, name, language) {
  // Input validation
  if (!type || !name) {
    console.log('Template type and name are required');
    return null;
  }

  // Normalize language code
  language = (language || DEFAULT_LANGUAGE).toLowerCase();

  // Initialize template cache if not already done
  if (!cacheInitialized && MEMORY_CACHE_ENABLED) {
    initializeTemplateCache();
  }

  try {
    let template;

    // Try to get the template from cache first
    if (MEMORY_CACHE_ENABLED) {
      // Check if the template type exists
      if (!templateCache[type]) {
        console.log(`Template type '${type}' not found in cache`);
        return null;
      }

      // Check if the template name exists for this type
      if (!templateCache[type][name]) {
        console.log(`Template name '${name}' not found for type '${type}' in cache`);
        return null;
      }

      // Try to get the template in the requested language
      template = templateCache[type][name][language];

      // If not available in requested language, fall back to default language
      if (!template && language !== DEFAULT_LANGUAGE) {
        console.log(`Template '${type}.${name}' not available in '${language}', falling back to '${DEFAULT_LANGUAGE}'`);
        template = templateCache[type][name][DEFAULT_LANGUAGE];
      }
    } else {
      // If cache is disabled, try to load the template directly from disk
      const templatePath = path.join(TEMPLATES_DIR, type, language, `${name}.json`);
      
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        template = JSON.parse(templateContent);
      } else if (language !== DEFAULT_LANGUAGE) {
        // Try fallback to default language
        const defaultTemplatePath = path.join(TEMPLATES_DIR, type, DEFAULT_LANGUAGE, `${name}.json`);
        
        if (fs.existsSync(defaultTemplatePath)) {
          const templateContent = fs.readFileSync(defaultTemplatePath, 'utf8');
          template = JSON.parse(templateContent);
        }
      }
    }

    if (!template) {
      console.log(`Template '${type}.${name}' not found in any language`);
    }

    return template || null;
  } catch (error) {
    console.log(`Error retrieving template '${type}.${name}' in '${language}':`, error);
    return null;
  }
}

/**
 * List all available templates, optionally filtered by type
 * 
 * @param {string} [filterType] - Optional type to filter by
 * @returns {Array} Array of template identifiers in format "type.name"
 */
function listAvailableTemplates(filterType) {
  // Initialize template cache if not already done
  if (!cacheInitialized && MEMORY_CACHE_ENABLED) {
    initializeTemplateCache();
  }
  
  const result = [];
  
  if (MEMORY_CACHE_ENABLED) {
    // Get templates from cache
    Object.keys(templateCache).forEach(type => {
      if (!filterType || type === filterType) {
        Object.keys(templateCache[type]).forEach(name => {
          result.push(`${type}.${name}`);
        });
      }
    });
  } else {
    // Get templates from disk
    try {
      const types = filterType ? [filterType] : (fs.existsSync(TEMPLATES_DIR) ? fs.readdirSync(TEMPLATES_DIR) : []);
      
      types.forEach(type => {
        const typeDir = path.join(TEMPLATES_DIR, type);
        if (!fs.existsSync(typeDir) || !fs.statSync(typeDir).isDirectory()) return;
        
        // Get all language directories
        fs.readdirSync(typeDir).forEach(lang => {
          const langDir = path.join(typeDir, lang);
          if (!fs.statSync(langDir).isDirectory()) return;
          
          // Get all template files in this language
          fs.readdirSync(langDir).forEach(fileName => {
            if (!fileName.endsWith('.json')) return;
            
            const templateName = fileName.replace('.json', '');
            const templateId = `${type}.${templateName}`;
            
            // Only add template ID if it's not already in the result
            if (!result.includes(templateId)) {
              result.push(templateId);
            }
          });
        });
      });
    } catch (error) {
      console.log('Failed to list available templates from disk:', error);
    }
  }
  
  return result;
}

/**
 * Check if a template exists for a specific type and name (in any language)
 * 
 * @param {string} type - The template type
 * @param {string} name - The template name
 * @returns {boolean} Whether the template exists
 */
function templateExists(type, name) {
  // Initialize template cache if not already done
  if (!cacheInitialized && MEMORY_CACHE_ENABLED) {
    initializeTemplateCache();
  }
  
  if (MEMORY_CACHE_ENABLED) {
    // Check cache
    return !!(templateCache[type] && templateCache[type][name]);
  } else {
    // Check disk
    try {
      // Check if there's a template in any language
      const typeDir = path.join(TEMPLATES_DIR, type);
      if (!fs.existsSync(typeDir)) return false;
      
      const langDirs = fs.readdirSync(typeDir);
      for (const lang of langDirs) {
        const langDir = path.join(typeDir, lang);
        if (!fs.statSync(langDir).isDirectory()) continue;
        
        const templatePath = path.join(langDir, `${name}.json`);
        if (fs.existsSync(templatePath)) return true;
      }
      
      return false;
    } catch (error) {
      console.log(`Failed to check if template ${type}.${name} exists:`, error);
      return false;
    }
  }
}

/**
 * Get all available languages for a specific template
 * 
 * @param {string} type - The template type
 * @param {string} name - The template name
 * @returns {Array} Array of available language codes
 */
function getTemplateLanguages(type, name) {
  // Initialize template cache if not already done
  if (!cacheInitialized && MEMORY_CACHE_ENABLED) {
    initializeTemplateCache();
  }
  
  if (!templateExists(type, name)) {
    return [];
  }
  
  if (MEMORY_CACHE_ENABLED) {
    // Get languages from cache
    return Object.keys(templateCache[type][name]);
  } else {
    // Get languages from disk
    try {
      const languages = [];
      const typeDir = path.join(TEMPLATES_DIR, type);
      
      const langDirs = fs.readdirSync(typeDir);
      for (const lang of langDirs) {
        const langDir = path.join(typeDir, lang);
        if (!fs.statSync(langDir).isDirectory()) continue;
        
        const templatePath = path.join(langDir, `${name}.json`);
        if (fs.existsSync(templatePath)) {
          languages.push(lang);
        }
      }
      
      return languages;
    } catch (error) {
      console.log(`Failed to get languages for template ${type}.${name}:`, error);
      return [];
    }
  }
}

/**
 * Render a template by replacing placeholders with actual values
 *
 * @param {string|Object} template - The template string or object with template properties
 * @param {Object} data - The data to use for rendering
 * @returns {string|Object} The rendered template
 */
function renderTemplate(template, data) {
  // No data to render with
  if (!data) return template;
  
  // Handle different template types
  if (typeof template === 'string') {
    // Simple string template
    return renderString(template, data);
  } else if (typeof template === 'object') {
    // Object with multiple string properties (e.g., email with subject and body)
    const rendered = {};
    
    Object.keys(template).forEach(key => {
      if (typeof template[key] === 'string') {
        rendered[key] = renderString(template[key], data);
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
 * @returns {string} The rendered string
 */
function renderString(str, data) {
  if (typeof str !== 'string') return str;
  
  let result = str;
  
  // Replace all {{placeholder}} occurrences with actual values
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
  });
  
  return result;
}

/**
 * Clear the template cache, forcing templates to be reloaded from disk
 */
function clearCache() {
  templateCache = {};
  cacheInitialized = false;
  console.log('Template cache cleared');
}

// Initialize the template cache on module load if caching is enabled
if (MEMORY_CACHE_ENABLED) {
  initializeTemplateCache();
}

// Export the utility functions
module.exports = {
  getTemplate,
  listAvailableTemplates,
  templateExists,
  getTemplateLanguages,
  saveTemplate,
  renderTemplate,
  clearCache,
  DEFAULT_LANGUAGE
};