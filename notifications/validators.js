/**
 * Validation utilities for the notification system
 */

/**
 * Validates an email address format
 *
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;

  // RFC 5322 compliant email regex pattern
  const emailPattern =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return emailPattern.test(email.trim().toLowerCase());
}

/**
 * Validates multiple email addresses (comma-separated)
 *
 * @param {string} emails - Comma-separated email addresses
 * @returns {Object} - Result with validity and invalid emails
 */
function validateEmailAddresses(emails) {
  if (!emails) return { isValid: false, invalidEmails: ["No email provided"] };

  // Support for multiple email addresses separated by commas
  const emailList = emails.split(",").map((e) => e.trim());
  const invalidEmails = emailList.filter((email) => !isValidEmail(email));

  return {
    isValid: invalidEmails.length === 0,
    invalidEmails: invalidEmails,
  };
}

module.exports = {
  isValidEmail,
  validateEmailAddresses,
};
