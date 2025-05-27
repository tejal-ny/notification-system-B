
/**
 * Configuration management module
 * 
 * Loads and validates environment variables for the application
 */

// Load environment variables from .env file
require('dotenv').config();

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  defaultFrom: process.env.EMAIL_FROM || 'notification-system@example.com'
};

// Validate required configuration
function validateConfig() {
  const missingVars = [];
  
  // Validate email configuration if we're not in mock mode
  if (process.env.EMAIL_MODE !== 'mock') {
    if (!emailConfig.host) missingVars.push('EMAIL_HOST');
    if (!emailConfig.auth.user) missingVars.push('EMAIL_USER');
    if (!emailConfig.auth.pass) missingVars.push('EMAIL_PASSWORD');
  }
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Email functionality may be limited. Check your .env file.');
  }
}

// Export configuration
module.exports = {
  email: emailConfig,
  isDev: process.env.NODE_ENV !== 'production',
  validateConfig
};