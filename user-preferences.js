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
      smsEnabled: true,   // Default to opt-out for SMS (requires explicit opt-in)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      preferredLanguage: "en"
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
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      preferredLanguage: "en"
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

  /**
 * Validate a language code
 * 
 * @param {string} languageCode - Language code to validate (e.g., 'en', 'es', 'fr')
 * @returns {boolean} Whether the language code is valid
 */
function isValidLanguageCode(languageCode) {
    // If not a string or empty, it's invalid
    if (!languageCode || typeof languageCode !== 'string') {
      return false;
    }
    
    // Trim whitespace
    const code = languageCode.trim();
    
    // Basic validation: 
    // - Must be 2-3 characters for ISO 639-1/639-2 language codes
    // - Can also support 5 chars for language-region (e.g., 'en-US', 'fr-CA')
    // - Allow only letters and hyphens
    return /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?$/.test(code);
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

    // Validate language
  if (!isValidLanguageCode(language)) {
    console.error(`Invalid language code: ${language}. Using default 'en' instead.`);
    language = "en";
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
 * Update preferences for an existing user only with strict validation
 * 
 * Unlike updateUserPreferences, this function will not create a new user
 * if they don't exist. It only updates existing users and enforces strict
 * data type validation.
 * 
 * @param {string} userId - User ID or email
 * @param {Object} preferences - Object containing preferences to update
 * @param {boolean} [preferences.emailEnabled] - Whether email notifications are enabled
 * @param {boolean} [preferences.smsEnabled] - Whether SMS notifications are enabled
 * @param {string} [preferences.preferredLanguage] - User's preferred language code
 * @returns {Object|{error: string}} - Updated preferences or error object with description
 */
function updateExistingUserPreferences(userId, preferences) {
    // Validate user ID
    if (!isValidUserId(userId)) {
      const error = `Invalid user ID: ${userId}`;
      console.error(error);
      return { error };
    }
    
    // Check if user exists in the preferences store
    if (!preferencesStore[userId]) {
      const error = `User ${userId} does not exist in preferences store`;
      console.error(error);
      return { error };
    }
    
    // Ensure preferences is an object
    if (!preferences || typeof preferences !== 'object') {
      const error = 'Preferences must be an object';
      console.error(error);
      return { error };
    }
    
    // Validate preference types
    if ('emailEnabled' in preferences && typeof preferences.emailEnabled !== 'boolean') {
      const error = 'emailEnabled must be a boolean';
      console.error(error);
      return { error };
    }
    
    if ('smsEnabled' in preferences && typeof preferences.smsEnabled !== 'boolean') {
      const error = 'smsEnabled must be a boolean';
      console.error(error);
      return { error };
    }
    
    if ('preferredLanguage' in preferences && !isValidLanguageCode(preferences.preferredLanguage)) {
      const error = `Invalid language code: ${preferences.preferredLanguage}`;
      console.error(error);
      return { error };
    }
    
    // Ensure at least one valid preference field is provided
    if (!('emailEnabled' in preferences || 'smsEnabled' in preferences || 'preferredLanguage' in preferences)) {
      const error = 'No valid preference fields provided. Must include emailEnabled, smsEnabled, and/or preferredLanguage.';
      console.error(error);
      return { error };
    }
    
    // Create a new preferences object with only validated fields
    const updates = {};
    
    // Only include valid preference fields
    if ('emailEnabled' in preferences) {
      updates.emailEnabled = preferences.emailEnabled;
    }
    
    if ('smsEnabled' in preferences) {
      updates.smsEnabled = preferences.smsEnabled;
    }
    
    if ('preferredLanguage' in preferences) {
      updates.preferredLanguage = preferences.preferredLanguage;
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

  /**
 * Toggle a notification channel preference for a specific user
 * 
 * This function flips the current boolean value for the specified channel
 * (email or sms) from true to false or vice versa.
 * 
 * @param {string} userId - User ID or email
 * @param {string} channel - Notification channel ('email' or 'sms')
 * @returns {Object|null} Updated preferences or null if failed
 */
function toggleChannelPreference(userId, channel) {
    // Validate user ID
    if (!isValidUserId(userId)) {
      console.error(`Invalid user ID: ${userId}`);
      return null;
    }
    
    // Validate channel
    if (!channel || (channel.toLowerCase() !== 'email' && channel.toLowerCase() !== 'sms')) {
      console.error(`Invalid channel: ${channel}. Must be 'email' or 'sms'`);
      return null;
    }
    
    // Get current preferences
    const currentPrefs = getUserPreferences(userId);
    
    // Prepare update object
    const updates = {};
    
    // Toggle the appropriate channel preference
    switch (channel.toLowerCase()) {
      case 'email':
        updates.emailEnabled = !currentPrefs.emailEnabled;
        break;
      case 'sms':
        updates.smsEnabled = !currentPrefs.smsEnabled;
        break;
    }
    
    // Log the change
    console.log(`Toggling ${channel} preference for ${userId}: ${currentPrefs[`${channel.toLowerCase()}Enabled`]} → ${updates[`${channel.toLowerCase()}Enabled`]}`);
    
    // Apply the update
    return updateUserPreferences(userId, updates);
  }

  /**
 * Update a user's notification preferences
 * 
 * @param {string} userId - User ID or email
 * @param {Object} updates - Preference updates to apply
 * @returns {Object|null} Updated preferences or null if failed
 */
function updateUserPreferences(userId, updates) {
    // Validate user ID
    if (!isValidUserId(userId)) {
      console.error(`Invalid user ID: ${userId}`);
      return null;
    }
    
    // Ensure updates is an object
    if (!updates || typeof updates !== 'object') {
      console.error('Updates must be an object');
      return null;
    }
    
    // Validate preferredLanguage if it's being updated
    if ('preferredLanguage' in updates) {
      if (!isValidLanguageCode(updates.preferredLanguage)) {
        console.error(`Invalid language code: ${updates.preferredLanguage}`);
        // If invalid, default to "en" rather than failing the whole update
        updates.preferredLanguage = "en";
      }
    }
    
    // Get current preferences or defaults
    const currentPrefs = getUserPreferences(userId);
    
    // Apply updates
    const updatedPrefs = {
      ...currentPrefs,
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
 * Get a list of users who have opted in to a specific notification channel
 * 
 * This function filters through all stored preferences and returns an array
 * of user IDs who have the specified channel enabled (set to true).
 * 
 * @param {string} channel - Notification channel ('email' or 'sms')
 * @returns {string[]} Array of user IDs who have opted in to the channel
 */
function getChannelOptedInUsers(channel) {
    // Validate channel
    if (!channel) {
      console.error('Channel must be specified');
      return [];
    }
    
    const channelLower = channel.toLowerCase();
    
    // Verify it's a supported channel
    if (channelLower !== 'email' && channelLower !== 'sms') {
      console.error(`Unknown notification channel: ${channel}`);
      return [];
    }
    
    const optedInUsers = [];
    
    // Determine which property to check
    const preferenceProperty = channelLower === 'email' ? 'emailEnabled' : 'smsEnabled';
    
    // Iterate through all user preferences
    Object.entries(preferencesStore).forEach(([userId, preferences]) => {
      // Check if the user has the channel enabled
      if (preferences[preferenceProperty] === true) {
        optedInUsers.push(userId);
      }
    });

    console.log(`Users opted in for ${channel} notifications:`, optedInUsers);
    
    return optedInUsers;
  }

  /**
 * Remove a user's preferences (hard delete)
 * 
 * This function completely removes a user's data from the store.
 * For soft deletion, use softDeleteUserPreferences instead.
 * 
 * @param {string} userId - User ID or email
 * @returns {boolean} Whether the removal was successful
 */
function removeUserPreferences(userId) {
    // Validate user ID
    if (!isValidUserId(userId) || !preferencesStore[userId]) {
      return false;
    }
    
    // Remove from store
    delete preferencesStore[userId];
    
    // Persist changes
    return savePreferences();
  }
  
  /**
   * Soft delete a user's preferences
   * 
   * This marks a user as deleted without actually removing their data.
   * Functions that retrieve user preferences will ignore soft-deleted users.
   * 
   * @param {string} userId - User ID or email
   * @returns {boolean} Whether the soft deletion was successful
   */
  function softDeleteUserPreferences(userId) {
    // Validate user ID
    if (!isValidUserId(userId)) {
      console.error(`Invalid user ID: ${userId}`);
      return false;
    }
    
    // Check if user exists
    if (!preferencesStore[userId]) {
      console.error(`User not found: ${userId}`);
      return false;
    }
    
    // Mark as deleted and update timestamp
    preferencesStore[userId].isDeleted = true;
    preferencesStore[userId].updatedAt = new Date().toISOString();
    
    console.log(`User ${userId} has been soft deleted`);
    
    // Persist changes
    return savePreferences();
  }
  
  /**
   * Restore a soft-deleted user's preferences
   * 
   * This unmarks a user as deleted, making them visible in retrieval functions again.
   * 
   * @param {string} userId - User ID or email
   * @returns {boolean} Whether the restoration was successful
   */
  function restoreUserPreferences(userId) {
    // Validate user ID
    if (!isValidUserId(userId)) {
      console.error(`Invalid user ID: ${userId}`);
      return false;
    }
    
    // Check if user exists
    if (!preferencesStore[userId]) {
      console.error(`User not found: ${userId}`);
      return false;
    }
    
    // Make sure user was actually deleted
    if (preferencesStore[userId].isDeleted !== true) {
      console.log(`User ${userId} was not deleted, no restoration needed`);
      return true;
    }
    
    // Remove deletion flag and update timestamp
    preferencesStore[userId].isDeleted = false;
    preferencesStore[userId].updatedAt = new Date().toISOString();
    
    console.log(`User ${userId} has been restored`);
    
    // Persist changes
    return savePreferences();
  }

  /**
 * Get preferences for a specific user, creating default preferences if user doesn't exist
 * 
 * If the user doesn't exist in the preferences data, this function will automatically
 * initialize them with default preferences and persist this to the JSON file.
 * If the user exists but is soft-deleted, behavior depends on the includeDeleted parameter.
 * 
 * @param {string} userId - User ID or email
 * @param {Object} [defaultOverrides={}] - Override default values if creating new user
 * @param {boolean} [includeDeleted=false] - Whether to include soft-deleted users
 * @returns {Object|null} User preferences or null if invalid userId or user is deleted
 */
function getUserPreferences(userId, defaultOverrides = {}, includeDeleted = false) {
    // Validate user ID
    if (!isValidUserId(userId)) {
      console.error(`Invalid user ID: ${userId}`);
      return null;
    }
    
    // Check if user exists in the preferences store
    if (!preferencesStore[userId]) {
      // User doesn't exist - create default preferences
      console.log(`Creating default preferences for new user: ${userId}`);
      
      // Create default preferences with any overrides
      const defaultPrefs = createDefaultPreferences(defaultOverrides);
      
      // Store in preferences store
      preferencesStore[userId] = defaultPrefs;
      
      // Persist to file
      savePreferences();
      
      console.log(`Default preferences created and saved for: ${userId}`);
    } else if (preferencesStore[userId].isDeleted === true && !includeDeleted) {
      // User exists but is soft-deleted and we are not including deleted users
      console.log(`User ${userId} is marked as deleted and includeDeleted=false`);
      return null;
    }
    
    // Return existing (or newly created) preferences
    return preferencesStore[userId];
  }

  /**
 * Check if a user has opted in to a specific notification channel
 * 
 * This function respects soft deletion by default - deleted users are considered
 * not opted in to any channel unless includeDeleted is set to true.
 * 
 * @param {string} userId - User ID or email
 * @param {string} channel - Notification channel ('email' or 'sms')
 * @param {boolean} [includeDeleted=false] - Whether to include soft-deleted users
 * @returns {boolean} Whether the user has opted in
 */
function hasUserOptedIn(userId, channel, includeDeleted = false) {
    // Default response if invalid input
    if (!isValidUserId(userId) || !channel) {
      return false;
    }
    
    // Get user preferences (respects soft deletion based on includeDeleted parameter)
    const preferences = getUserPreferences(userId, {}, includeDeleted);
    
    // If preferences is null (which can happen if user is deleted and includeDeleted=false)
    if (!preferences) {
      return false;
    }
    
    // Check the appropriate preference based on channel
    switch (channel.toLowerCase()) {
      case 'email':
        return preferences.emailEnabled === true;
      case 'sms':
        return preferences.smsEnabled === true;
      default:
        console.error(`Unknown notification channel: ${channel}`);
        return false;
    }
  }

  /**
 * Get a list of user IDs who have opted in to a specific notification channel
 * 
 * By default, this function excludes soft-deleted users from the results.
 * 
 * @param {string} channel - Notification channel ('email' or 'sms')
 * @param {boolean} [includeDeleted=false] - Whether to include soft-deleted users
 * @returns {string[]} Array of user IDs who have opted in to the specified channel
 */
function getUsersOptedInToChannel(channel, includeDeleted = false) {
    // Validate channel parameter
    if (!channel || typeof channel !== 'string') {
      console.error('Invalid channel parameter');
      return [];
    }
  
    // Normalize channel name to lowercase
    const normalizedChannel = channel.toLowerCase();
    
    // Validate that channel is supported
    if (normalizedChannel !== 'email' && normalizedChannel !== 'sms') {
      console.error(`Unsupported notification channel: ${channel}`);
      return [];
    }
  
    // Determine which preference field to check
    const preferenceField = normalizedChannel === 'email' ? 'emailEnabled' : 'smsEnabled';
    
    // Filter users who have opted in to the specified channel
    // Also filter out soft-deleted users unless includeDeleted is true
    const optedInUsers = Object.entries(preferencesStore)
      .filter(([userId, preferences]) => {
        // Check if the user has opted in to the channel
        const hasOptedIn = preferences[preferenceField] === true;
        
        // Check if the user is not deleted or if we're including deleted users
        const isVisibleUser = !preferences.isDeleted || includeDeleted;
        
        // Return true only if both conditions are met
        return hasOptedIn && isVisibleUser;
      })
      .map(([userId]) => userId);
    
    const deletionStatus = includeDeleted ? '(including deleted)' : '(excluding deleted)';
    console.log(`Found ${optedInUsers.length} users opted in to ${normalizedChannel} notifications ${deletionStatus}`);
    
    return optedInUsers;
  }
  
  /**
 * Get all user preferences
 * 
 * By default, this excludes soft-deleted users from the results.
 * 
 * @param {boolean} [includeDeleted=false] - Whether to include soft-deleted users
 * @returns {Object} All user preferences (filtered by deletion status if specified)
 */
function getAllPreferences(includeDeleted = false) {
    if (includeDeleted) {
      // Return all preferences including deleted users
      return { ...preferencesStore };
    } else {
      // Filter out soft-deleted users
      const filteredPreferences = {};
      
      Object.entries(preferencesStore).forEach(([userId, preferences]) => {
        if (!preferences.isDeleted) {
          filteredPreferences[userId] = preferences;
        }
      });
      
      return filteredPreferences;
    }
  }
  

  module.exports = {
    createCustomDefaultPreferences,
    createDefaultPreferences,
    initializeNewUser,
    // updateNotificationPreferences,
    initializeNewUserWithAllEnabled,
    updateExistingUserPreferences,
    getOrCreateUserPreferences,
    initializeUsersWithDefaultPreferences,
    toggleChannelPreference,
    getChannelOptedInUsers,
    restoreUserPreferences,
    removeUserPreferences,
    softDeleteUserPreferences,
    getUserPreferences,
    hasUserOptedIn,
    getUsersOptedInToChannel,
    getAllPreferences
  };