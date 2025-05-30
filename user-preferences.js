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

function createDefaultPreferences() {
    return {
      emailEnabled: true,  // Default to opt-in for email
      smsEnabled: false,   // Default to opt-out for SMS (requires explicit opt-in)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Create default preferences with custom initial values
   * 
   * @param {boolean} [emailEnabled=true] - Initial email preference
   * @param {boolean} [smsEnabled=true] - Initial SMS preference  
   * @returns {Object} Custom default preferences object
   */
function createCustomDefaultPreferences(emailEnabled = true, smsEnabled = true) {
    return {
      emailEnabled: emailEnabled === true,
      smsEnabled: smsEnabled === true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function isValidUserId(userId) {
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

let preferencesStore = {};
function savePreferences() {
    try {
      const data = JSON.stringify(preferencesStore, null, 2);
      fs.writeFileSync(PREFERENCES_FILE, data, 'utf8');
      return true;
    } catch (error) {
      console.error('Failed to save preferences:', error.message);
      return false;
    }
  }

  /**
 * Initialize a new user with default notification preferences
 * Only adds the user if they don't already exist in the preferences store
 * 
 * @param {string} userId - User ID or email
 * @param {boolean} [emailEnabled=true] - Initial email opt-in status
 * @param {boolean} [smsEnabled=true] - Initial SMS opt-in status
 * @returns {Object|null} The new user preferences or null if user already exists or is invalid
 */
function initializeNewUser(userId, emailEnabled = true, smsEnabled = true) {
    console.log(`Initializing new user with ID: ${userId}`);
    // Validate user ID
    if (!isValidUserId(userId)) {
      console.error(`Invalid user ID: ${userId}`);
      return null;
    }
    
    // Check if user already exists
    if (preferencesStore[userId]) {
      console.log(`User ${userId} already has preferences, not initializing`);
      return null; // User already exists, don't overwrite
    }
    
    // Create new preferences with the specified opt-in values
    const newPreferences = createCustomDefaultPreferences(emailEnabled, smsEnabled);
    
    // Add to preferences store
    preferencesStore[userId] = newPreferences;
    
    // Persist changes
    savePreferences();
    
    return newPreferences;
  }

  /**
 * Initialize a new user with both email and SMS notification preferences enabled
 * 
 * This function only creates the user if they don't already exist in the preferences store.
 * 
 * @param {string} userId - User ID or email 
 * @returns {Object|null} The new user preferences or null if user already exists/invalid ID
 */
function initializeNewUserWithAllEnabled(userId) {
    // Validate user ID
    if (!isValidUserId(userId)) {
      console.error(`Invalid user ID: ${userId}`);
      return null;
    }
    
    // Check if user already exists
    if (preferencesStore[userId]) {
      console.log(`User ${userId} already exists in preferences store. No changes made.`);
      return null; // User already exists, don't overwrite
    }
    
    // Create new user with both email and SMS enabled
    const preferences = createDefaultPreferences({
      emailEnabled: true,
      smsEnabled: true
    });
    
    // Store in the preferences object
    preferencesStore[userId] = preferences;
    
    // Save to file
    savePreferences();
    
    return preferences;
  }
  
/**
 * Update preferences for an existing user only
 * 
 * Unlike updateUserPreferences, this function will not create a new user
 * if they don't exist. It only updates existing users.
 * 
 * @param {string} userId - User ID or email
 * @param {Object} preferences - Object containing preferences to update
 * @param {boolean} [preferences.emailEnabled] - Whether email notifications are enabled
 * @param {boolean} [preferences.smsEnabled] - Whether SMS notifications are enabled
 * @returns {Object|{error: string}} - Updated preferences object or error object with details
 */
function updateExistingUserPreferences(userId, preferences) {
    // Validate user ID
    if (!isValidUserId(userId)) {
      const errorMsg = `Invalid user ID: ${userId}`;
      console.error(errorMsg);
      return { error: errorMsg, code: 'INVALID_USER_ID' };
    }
    
    // Validate preferences object
    if (!preferences) {
      const errorMsg = 'Preferences cannot be null or undefined';
      console.error(errorMsg);
      return { error: errorMsg, code: 'MISSING_PREFERENCES' };
    }
    
    if (typeof preferences !== 'object' || Array.isArray(preferences)) {
      const errorMsg = 'Preferences must be a plain object';
      console.error(errorMsg);
      return { error: errorMsg, code: 'INVALID_PREFERENCES_TYPE' };
    }
    
    // Check if user exists
    if (!preferencesStore[userId]) {
      const errorMsg = `User ${userId} not found in preferences store`;
      console.error(errorMsg);
      return { error: errorMsg, code: 'USER_NOT_FOUND' };
    }
    
    // Create a new preferences object with only valid fields
    const updates = {};
    const validationErrors = [];
    
    // Strictly validate email preference
    if ('emailEnabled' in preferences) {
      if (typeof preferences.emailEnabled === 'boolean') {
        updates.emailEnabled = preferences.emailEnabled;
      } else {
        const errorMsg = `Invalid value for emailEnabled: ${preferences.emailEnabled}. Must be a boolean.`;
        validationErrors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    // Strictly validate SMS preference  
    if ('smsEnabled' in preferences) {
      if (typeof preferences.smsEnabled === 'boolean') {
        updates.smsEnabled = preferences.smsEnabled;
      } else {
        const errorMsg = `Invalid value for smsEnabled: ${preferences.smsEnabled}. Must be a boolean.`;
        validationErrors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    // Check for any unexpected fields and report them
    const validFields = ['emailEnabled', 'smsEnabled'];
    Object.keys(preferences).forEach(key => {
      if (!validFields.includes(key)) {
        const errorMsg = `Unknown preference field: ${key}. Valid fields are: ${validFields.join(', ')}`;
        validationErrors.push(errorMsg);
        console.error(errorMsg);
      }
    });
    
    // If validation errors occurred, return them without updating
    if (validationErrors.length > 0) {
      return {
        error: 'Validation errors occurred',
        validationErrors,
        code: 'VALIDATION_ERROR'
      };
    }
    
    // If no valid updates, return error
    if (Object.keys(updates).length === 0) {
      const errorMsg = 'No valid preference fields provided';
      console.error(errorMsg);
      return { error: errorMsg, code: 'NO_VALID_FIELDS' };
    }
    
    // Update the user's preferences
    const updatedPrefs = {
      ...preferencesStore[userId],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Store updated preferences
    preferencesStore[userId] = updatedPrefs;
    
    // Persist to file
    savePreferences();
    
    return updatedPrefs;
  }

  /**
 * Get preferences for a specific user
 * 
 * @param {string} userId - User ID or email
 * @returns {Object|null} User preferences or null if invalid userId
 */
function getUserPreferences(userId) {
    // Validate user ID
    if (!isValidUserId(userId)) {
      console.error(`Invalid user ID: ${userId}`);
      return null;
    }
    
    // Return existing preferences or create default
    return preferencesStore[userId] || createDefaultPreferences();
  }
  
  /**
   * Get or create user preferences - ensures a user always has valid preferences
   * 
   * This function retrieves a user's preferences, or automatically initializes 
   * default preferences if they don't exist yet. This ensures that all users
   * have valid preference settings when queried.
   *
   * @param {string} userId - User ID or email
   * @param {Object} [defaultOverrides={}] - Optional overrides for default values
   * @returns {Object|{error: string}} User preferences or error object if invalid userId
   */
  function getOrCreateUserPreferences(userId, defaultOverrides = {}) {
    // Validate user ID
    if (!isValidUserId(userId)) {
      const error = `Invalid user ID: ${userId}`;
      console.error(error);
      return { error };
    }
    
    // Check if user already exists in preferences
    if (preferencesStore[userId]) {
      // Return existing preferences
      return preferencesStore[userId];
    }
    
    // User doesn't exist, create default preferences
    console.log(`User ${userId} not found. Creating default preferences.`);
    
    // Create default preferences with any provided overrides
    const newPreferences = createDefaultPreferences(defaultOverrides);
    
    // Store in preferences store
    preferencesStore[userId] = newPreferences;
    
    // Persist to file
    savePreferences();
    
    // Return the newly created preferences
    return newPreferences;
  }

  /**
 * Initialize default preferences for multiple users
 * 
 * This function accepts an array of user IDs and initializes default preferences
 * for each user who doesn't already have preferences saved. It skips users
 * who already have existing preferences.
 * 
 * @param {string[]} userIds - Array of user IDs to initialize
 * @param {Object} [defaultOverrides={}] - Optional overrides for default values
 * @returns {Object} Result object with success and failure counts
 */
function initializeUsersWithDefaultPreferences(userIds, defaultOverrides = {}) {
    // Validate input
    if (!Array.isArray(userIds)) {
      console.error('Expected an array of user IDs');
      return { 
        success: false, 
        initialized: 0, 
        skipped: 0, 
        invalid: 0,
        totalProcessed: 0
      };
    }
  
    // Initialize counters for the result
    const result = {
      success: true,
      initialized: 0,   // Count of users who were newly initialized
      skipped: 0,       // Count of users who already had preferences
      invalid: 0,       // Count of invalid user IDs
      totalProcessed: userIds.length
    };
  
    // Process each user ID
    for (const userId of userIds) {
      // Skip invalid user IDs but count them
      if (!isValidUserId(userId)) {
        console.error(`Skipping invalid user ID: ${userId}`);
        result.invalid++;
        continue;
      }
  
      // Check if user already has preferences
      if (preferencesStore[userId]) {
        console.log(`User ${userId} already has preferences - skipping`);
        result.skipped++;
        continue;
      }
  
      // User doesn't exist yet - create new preferences
      const defaultPrefs = createDefaultPreferences(defaultOverrides);
      
      // Store in preferences store
      preferencesStore[userId] = defaultPrefs;
      
      console.log(`Default preferences created for: ${userId}`);
      result.initialized++;
    }
  
    // Only save to file if we actually initialized any users
    if (result.initialized > 0) {
      if (!savePreferences()) {
        result.success = false;
        console.error('Failed to save preferences to file');
      }
    }
  
    return result;
  }

  module.exports = {
    createCustomDefaultPreferences,
    createDefaultPreferences,
    initializeNewUser,
    // updateNotificationPreferences,
    initializeNewUserWithAllEnabled,
    updateExistingUserPreferences,
    getOrCreateUserPreferences,
    initializeUsersWithDefaultPreferences
  };