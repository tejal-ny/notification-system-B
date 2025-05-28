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


/**
 * Basic phone number validation and formatting
 * 
 * @param {string} phoneNumber - Phone number to validate
 * @returns {Object} - Validation result with formatted number if valid
 */
function validatePhoneNumber(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return { 
      isValid: false, 
      error: 'Phone number is required'
    };
  }

  // Remove all non-digit characters for validation
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Basic validation: should have enough digits for a phone number
  // Most international numbers are 7-15 digits
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { 
      isValid: false, 
      error: `Phone number contains ${digitsOnly.length} digits, expected 7-15 digits`
    };
  }

  // Attempt to format as E.164 for international compatibility
  // This is a simplified version - production code might use a library like libphonenumber
  let formattedNumber;
  
  // If number starts with + or has country code, assume it's already formatted
  if (phoneNumber.startsWith('+')) {
    formattedNumber = phoneNumber;
  } else if (digitsOnly.length === 10) {
    // Assume US number format if 10 digits
    formattedNumber = `+1${digitsOnly}`;
  } else if (digitsOnly.length > 10) {
    // Assume it includes country code - keep as is but add +
    formattedNumber = `+${digitsOnly}`;
  } else {
    // Keep original format but flag as potentially incomplete
    formattedNumber = phoneNumber;
    console.warn(`Phone number ${phoneNumber} may be incomplete for international use`);
  }

  return {
    isValid: true,
    formattedNumber
  };
}


module.exports = {
  isValidEmail,
  validateEmailAddresses,
  validatePhoneNumber
};