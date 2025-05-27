/**
 * Email notification module
 *
 * This module provides functionality to send email notifications
 * using a mock implementation or Nodemailer
 */

// Mock implementation for sending emails (for development/testing)
function sendEmailMock(to, subject, body) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      console.log("-------------------------");
      console.log("📧 MOCK EMAIL SENT:");
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
 * Sends an email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email body content
 * @param {Object} options - Additional options
 * @returns {Promise} - Resolves with send result
 */
async function sendEmail(to, subject, body, options = {}) {
  // For a real implementation with Nodemailer, uncomment:
  /*
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const result = await transporter.sendMail({
    from: options.from || process.env.EMAIL_FROM || 'notification-system@example.com',
    to: to,
    subject: subject,
    text: body,
    html: options.html || body
  });
  
  return result;
  */

  // Using mock implementation
  return sendEmailMock(to, subject, body);
}

module.exports = {
  sendEmail,
};
