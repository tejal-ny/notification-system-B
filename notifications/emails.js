/**
 * Email notification module
 *
 * This module provides functionality to send email notifications
 * using Nodemailer with environment-based configuration
 */

const nodemailer = require("nodemailer");
const config = require("../config");
const { validateEmailAddresses } = require("./validators");
// Import error handler
const errorHandler = require('../error-handler');
const logger = require('../logger');
// Validate email configuration on module load
config.validateConfig();

// Create transporter based on environment (mock or real)
let transporter;

// Initialize email transport
function initTransporter() {
  if (process.env.EMAIL_MODE === "mock" || config.isDev) {
    console.log("📧 Using mock email transport in development mode");
    return null; // No actual transporter needed for mock
  } else {
    // Create real nodemailer transport with configs from environment
    return nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.auth,
    });
  }
}

// Mock implementation for sending emails (for development/testing)
function sendEmailMock(recipient, message, options = {}) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      console.log("-------------------------");
      console.log("📧 MOCK EMAIL SENT:");
      console.log(`From: ${options.from || config.email.defaultFrom}`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log("-------------------------");
      console.log(body);
      console.log("-------------------------");
      resolve({ success: true, messageId: `mock-${Date.now()}` });
    }, 500);
  });
}

/**
 * Validates recipient email addresses and formats them
 *
 * @param {string|string[]} to - Single email or multiple emails (comma-separated or array)
 * @returns {Object} - Validation result with formatted recipients if valid
 */

function validateRecipients(to) {
  // Handle array of email addresses
  if (Array.isArray(to)) {
    to = to.join(",");
  }

  const validation = validateEmailAddresses(to);

  if (!validation.isValid) {
    return {
      isValid: false,
      error: `Invalid email address(es): ${validation.invalidEmails.join(
        ", "
      )}`,
      invalidEmails: validation.invalidEmails,
    };
  }

  return {
    isValid: true,
    recipients: to,
  };
}

/**
 * Sends an email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body content
 * @param {Object} options - Additional options
 * @returns {Promise} - Resolves with send result
 */
async function sendEmail(recipient, message, options = {}) {
  // Get from address from options or default from config
  const from = options.from || config.email.defaultFrom;

  
  // const recipientValidation = validateRecipients(to);
  try {
    // Check if we're in mock mode
    const mockMode = process.env.EMAIL_MOCK_MODE === 'true' || options.mockMode === true;
    
    // Simulate potential errors (for demonstration)
    if (recipient.includes('error') || (options.simulateError === true)) {
      throw new Error('Simulated email sending failure');
    }
    
    // Simulate a delay that might happen with real email sending
    if (options.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }
    
    // Generate a message ID for tracking
    const messageId = `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Log the outgoing notification
    logger.logEmail(recipient, message, {
      ...options,
      simulated: mockMode,
      messageId,
      status: 'sent'
    });
    
    // In a real implementation, this would send an actual email
    if (!mockMode) {
      // Here we would integrate with an actual email service
      // For example: await sendGridClient.send({ to: recipient, ... })
    }
    
    // Return a response like a real email API might
    return {
      type: 'email',
      recipient,
      message: message.length > 30 ? `${message.substring(0, 30)}...` : message,
      messageId,
      timestamp: new Date(),
      status: 'sent',
      simulated: mockMode
    };
  } catch (error) {
    // Log the failed notification
    logger.logEmail(recipient, message, {
      ...options,
      simulated: false,
      status: 'failed',
      error: error.message
    });
    
    // Let the error propagate to be handled by the error handler wrapper
    throw error;
  }
 

  try {
    // Send email using nodemailer
    const result = await transporter.sendMail({
      from: from,
      to: recipientValidation.recipients,
      subject: subject || "Notification",
      text: typeof body === "string" ? body : JSON.stringify(body),
      html:
        options.html ||
        (typeof body === "string" ? body : JSON.stringify(body)),
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}


/**
 * Internal implementation of email sending functionality
 * @param {string} recipient - Email address of the recipient
 * @param {string} message - The message to be sent
 * @param {Object} options - Additional options for the email
 * @returns {Promise<Object>} - Promise resolving to the result of the operation
 */
async function _sendEmail(recipient, message, options = {}) {
  // This function contains the actual email sending logic
  // In a real implementation, this would use an email service/library like nodemailer
  
  // Simulating potential errors that might occur
  if (Math.random() < 0.1) {  // 10% chance of random error for demo purposes
    throw new Error('Simulated email delivery failure');
  }
  
  // Simulate sending delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Log success (this would be removed in production)
  console.log(`[EMAIL] Successfully sent to: ${recipient}`);
  
  // Return success result
  return {
    channel: 'email',
    recipient,
    messageId: `email_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date(),
    status: 'sent',
    success: true
  };
}

// /**
//  * Send an email notification with error handling
//  * @param {string} recipient - Email address of the recipient
//  * @param {string} message - The message to be sent
//  * @param {Object} options - Additional options for the email
//  * @returns {Promise<Object>} - Promise resolving to the result of the operation
//  */
// async function send(recipient, message, options = {}) {
//   // Additional context information for logging
//   const contextInfo = {
//     subject: options.subject || '[No Subject]',
//     messageLength: message ? message.length : 0,
//     hasAttachments: options.attachments ? true : false,
//     timestamp: new Date().toISOString()
//   };
  
//   try {
//     // Log the attempt
//     console.log(`[INFO] [channel=EMAIL] [recipient=${recipient}] Sending email "${contextInfo.subject}"`);
    
//     // Send the email
//     const result = await _sendEmail(recipient, message, options);
    
//     // Return the successful result
//     return {
//       ...result,
//       success: true
//     };
//   } catch (error) {
//     // Use the error handler to log the error with all context
//     return errorHandler.createErrorResponse(
//       'email',
//       recipient,
//       error,
//       {
//         ...contextInfo,
//         messagePreview: message ? message.substring(0, 50) + '...' : null
//       }
//     );
//   }
// }

// Create a wrapped version that includes error handling directly
// Apply centralized error handling wrapper
const send = errorHandler.withErrorHandling(sendEmail, 'email');
const sendWithErrorHandling = errorHandler.withErrorHandling(
  _sendEmail,
  'email',
  null,  // recipient will be provided when called
  { source: 'email_module' }
);
module.exports = {
  sendEmail,
  send,
  sendWithErrorHandling,
  validateRecipients, // Export for testing
};
