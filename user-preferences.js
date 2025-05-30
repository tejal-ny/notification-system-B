/**
 * User Notification Preferences Module
 * 
 * Provides a system to manage user notification preferences with persistence
 * to a JSON file. Handles preferences for email and SMS notifications.
 */

const fs = require('fs');
const path = require('path');

// Configuration 
const PREFERENCES_FILE = process.env.PREFERENCES_FILE || 'preferences.json';
const EMAIL_VALIDATION_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * User preference data structure
 * {
 *   userId: string,       // Unique user identifier (or email)
 *   emailEnabled: boolean, // Whether user has opted in for email notifications
 *   smsEnabled: boolean,  // Whether user has opted in for SMS notifications
 *   phoneNumber: string,  // User's phone number (optional)
 *   lastUpdated: string   // ISO timestamp of last update
 * }
 */

class UserPreferences {
  constructor(preferencesFilePath) {
    this.preferencesFile = preferencesFilePath || PREFERENCES_FILE;
    this.preferences = new Map(); // In-memory store for user preferences
    this.loaded = false;
    
    // Create a directory for the preferences file if it doesn't exist
    const dir = path.dirname(this.preferencesFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Load preferences from file
   * @returns {Promise<boolean>} Success status
   */
  async load() {
    try {
      if (!fs.existsSync(this.preferencesFile)) {
        // Create an empty preferences file if it doesn't exist
        await fs.promises.writeFile(this.preferencesFile, JSON.stringify([]));
        this.loaded = true;
        return true;
      }

      const data = await fs.promises.readFile(this.preferencesFile, 'utf8');
      const preferencesArray = JSON.parse(data);
      
      // Reset the current preferences
      this.preferences.clear();
      
      // Load preferences into memory
      preferencesArray.forEach(pref => {
        this.preferences.set(pref.userId, pref);
      });
      
      this.loaded = true;
      return true;
    } catch (error) {
      console.error(`Failed to load preferences: ${error.message}`);
      // Initialize with empty preferences if loading fails
      this.preferences.clear();
      this.loaded = false;
      return false;
    }
  }

  /**
   * Save preferences to file
   * @returns {Promise<boolean>} Success status
   */
  async save() {
    try {
      const preferencesArray = Array.from(this.preferences.values());
      const data = JSON.stringify(preferencesArray, null, 2);
      await fs.promises.writeFile(this.preferencesFile, data);
      return true;
    } catch (error) {
      console.error(`Failed to save preferences: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate user ID or email format
   * @param {string} userId - User ID or email to validate
   * @returns {boolean} Whether the ID is valid
   */
  isValidUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      return false;
    }
    
    // If it looks like an email, validate the format
    if (userId.includes('@')) {
      return EMAIL_VALIDATION_REGEX.test(userId);
    }
    
    // Otherwise just ensure it's not empty
    return userId.trim().length > 0;
  }

  /**
   * Add a new user preference
   * @param {string} userId - Unique user ID or email
   * @param {boolean} emailEnabled - Whether email notifications are enabled
   * @param {boolean} smsEnabled - Whether SMS notifications are enabled
   * @param {string} [phoneNumber] - User's phone number (optional)
   * @returns {Object} The created user preference object
   * @throws {Error} If validation fails
   */
  addUserPreference(userId, emailEnabled = true, smsEnabled = false, phoneNumber = null) {
    // Make sure we've loaded data
    if (!this.loaded) {
      throw new Error('Preferences not loaded. Call load() before using the preferences system.');
    }
    
    // Validate user ID
    if (!this.isValidUserId(userId)) {
      throw new Error('Invalid user ID or email format.');
    }
    
    // Check if user already exists
    if (this.preferences.has(userId)) {
      throw new Error(`User preferences for '${userId}' already exist.`);
    }
    
    // Create the preference object
    const preference = {
      userId,
      emailEnabled: Boolean(emailEnabled),
      smsEnabled: Boolean(smsEnabled),
      phoneNumber: phoneNumber || null,
      lastUpdated: new Date().toISOString()
    };
    
    // Store in memory
    this.preferences.set(userId, preference);
    
    return preference;
  }

  /**
   * Get user preferences
   * @param {string} userId - User ID or email
   * @returns {Object|null} User preferences or null if not found
   */
  getUserPreference(userId) {
    // Make sure we've loaded data
    if (!this.loaded) {
      throw new Error('Preferences not loaded. Call load() before using the preferences system.');
    }
    
    return this.preferences.get(userId) || null;
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID or email
   * @param {Object} updates - Object containing fields to update
   * @returns {Object|null} Updated user preferences or null if user not found
   */
  updateUserPreference(userId, updates = {}) {
    // Make sure we've loaded data
    if (!this.loaded) {
      throw new Error('Preferences not loaded. Call load() before using the preferences system.');
    }
    
    // Check if user exists
    if (!this.preferences.has(userId)) {
      return null;
    }
    
    const preference = this.preferences.get(userId);
    
    // Apply updates
    if (updates.hasOwnProperty('emailEnabled')) {
      preference.emailEnabled = Boolean(updates.emailEnabled);
    }
    
    if (updates.hasOwnProperty('smsEnabled')) {
      preference.smsEnabled = Boolean(updates.smsEnabled);
    }
    
    if (updates.hasOwnProperty('phoneNumber')) {
      preference.phoneNumber = updates.phoneNumber || null;
    }
    
    // Update timestamp
    preference.lastUpdated = new Date().toISOString();
    
    // Store updated preference
    this.preferences.set(userId, preference);
    
    return preference;
  }

  /**
   * Remove user preferences
   * @param {string} userId - User ID or email
   * @returns {boolean} Whether the user was removed
   */
  removeUserPreference(userId) {
    // Make sure we've loaded data
    if (!this.loaded) {
      throw new Error('Preferences not loaded. Call load() before using the preferences system.');
    }
    
    return this.preferences.delete(userId);
  }

  /**
   * Get all user preferences
   * @returns {Array} Array of all user preferences
   */
  getAllPreferences() {
    // Make sure we've loaded data
    if (!this.loaded) {
      throw new Error('Preferences not loaded. Call load() before using the preferences system.');
    }
    
    return Array.from(this.preferences.values());
  }

  /**
   * Get number of user preferences
   * @returns {number} Count of user preferences
   */
  getCount() {
    return this.preferences.size;
  }

  /**
   * Check if user has enabled a specific notification type
   * @param {string} userId - User ID or email
   * @param {string} type - Notification type ('email' or 'sms')
   * @returns {boolean} Whether notifications are enabled for this type
   */
  isEnabled(userId, type) {
    const preference = this.getUserPreference(userId);
    
    if (!preference) {
      return false;
    }
    
    if (type === 'email') {
      return preference.emailEnabled;
    } else if (type === 'sms') {
      return preference.smsEnabled;
    }
    
    return false;
  }

  /**
   * Find users who have enabled a specific notification type
   * @param {string} type - Notification type ('email' or 'sms')
   * @returns {Array} Array of user preferences who have enabled this type
   */
  findUsersByPreference(type) {
    // Make sure we've loaded data
    if (!this.loaded) {
      throw new Error('Preferences not loaded. Call load() before using the preferences system.');
    }
    
    const result = [];
    
    for (const preference of this.preferences.values()) {
      if ((type === 'email' && preference.emailEnabled) || 
          (type === 'sms' && preference.smsEnabled)) {
        result.push(preference);
      }
    }
    
    return result;
  }
}

// Export a singleton instance with the default config
const userPreferences = new UserPreferences();

module.exports = {
  UserPreferences,       // Export the class for custom instances
  userPreferences,       // Export a singleton instance
};