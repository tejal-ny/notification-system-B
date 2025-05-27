/**
 * Email notification module
 * 
 * This module provides functionality to send email notifications
 * using Nodemailer with environment-based configuration
 */

const nodemailer = require('nodemailer');
const config = require('../config');

// Validate email configuration on module load
config.validateConfig();

// Create transporter based on environment (mock or real)
let transporter;

// Initialize email transport
function initTransporter() {
  if (process.env.EMAIL_MODE === 'mock' || config.isDev) {
    console.log('📧 Using mock email transport in development mode');
    return null; // No actual transporter needed for mock
  } else {
    // Create real nodemailer transport with configs from environment
    return nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.auth
    });
  }
}

// Mock implementation for sending emails (for development/testing)
function sendEmailMock(to, subject, body, options = {}) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      console.log('-------------------------');
      console.log('📧 MOCK EMAIL SENT:');
      console.log(`From: ${options.from || config.email.defaultFrom}`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('-------------------------');
      console.log(body);
      console.log('-------------------------');
      resolve({ success: true, messageId: `mock-${Date.now()}` });
    }, 500);
  });
}

/**
 * Sends an email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body content
 * @param {Object} options - Additional options
 * @returns {Promise} - Resolves with send result
 */
async function sendEmail(to, subject, body, options = {}) {
  // Get from address from options or default from config
  const from = options.from || config.email.defaultFrom;
  
  // Use mock implementation in development or mock mode
  if (process.env.EMAIL_MODE === 'mock' || config.isDev) {
    return sendEmailMock(to, subject, body, { ...options, from });
  }
  
  // Initialize transporter if not already done
  if (!transporter) {
    transporter = initTransporter();
  }
  
  try {
    // Send email using nodemailer
    const result = await transporter.sendMail({
      from: from,
      to: to,
      subject: subject,
      text: body,
      html: options.html || body
    });
    
    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  sendEmail,
};