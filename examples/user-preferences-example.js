/**
 * User Preferences Example
 * 
 * Demonstrates how to use the user preferences system to:
 * - Load user preferences from a file
 * - Add new user preferences
 * - Update existing preferences
 * - Check notification status (enabled/disabled)
 * - Save preferences back to the file
 */

const { userPreferences } = require('../user-preferences');

async function main() {
  try {
    console.log('Loading user preferences...');
    await userPreferences.load();
    console.log(`Loaded ${userPreferences.getCount()} user preferences`);
    
    // Display all current preferences
    console.log('\nCurrent user preferences:');
    const allPrefs = userPreferences.getAllPreferences();
    console.table(allPrefs);
    
    // Add a new user
    console.log('\nAdding a new user...');
    try {
      const newUser = userPreferences.addUserPreference(
        'david@example.com',  // userId/email
        true,                 // emailEnabled
        true,                 // smsEnabled
        '+15551112233'        // phoneNumber
      );
      console.log('Added new user:', newUser);
    } catch (error) {
      console.error('Failed to add user:', error.message);
    }
    
    // Update an existing user
    console.log('\nUpdating user preferences...');
    const updatedUser = userPreferences.updateUserPreference('bob@example.com', {
      smsEnabled: false,
      phoneNumber: '+15559998888'
    });
    
    if (updatedUser) {
      console.log('Updated user:', updatedUser);
    } else {
      console.log('User not found');
    }
    
    // Check if notifications are enabled for a specific user and type
    console.log('\nChecking notification preferences:');
    const users = ['alice@example.com', 'bob@example.com', 'charlie@example.com'];
    const types = ['email', 'sms'];
    
    for (const user of users) {
      for (const type of types) {
        const enabled = userPreferences.isEnabled(user, type);
        console.log(`${user} - ${type}: ${enabled ? 'Enabled ✓' : 'Disabled ✗'}`);
      }
    }
    
    // Find all users who have enabled email notifications
    console.log('\nUsers with email notifications enabled:');
    const emailUsers = userPreferences.findUsersByPreference('email');
    emailUsers.forEach(user => {
      console.log(`- ${user.userId}`);
    });
    
    // Find all users who have enabled SMS notifications
    console.log('\nUsers with SMS notifications enabled:');
    const smsUsers = userPreferences.findUsersByPreference('sms');
    smsUsers.forEach(user => {
      console.log(`- ${user.userId} (${user.phoneNumber || 'No phone number'})`);
    });
    
    // Save changes back to the file
    console.log('\nSaving preferences to file...');
    const saveResult = await userPreferences.save();
    console.log(`Save ${saveResult ? 'succeeded' : 'failed'}`);
    
    // Demonstration of loading error handling
    console.log('\nDemonstrating error handling:');
    try {
      // Try to add a user with invalid email
      userPreferences.addUserPreference('invalid-email', true, false);
    } catch (error) {
      console.error('Expected error:', error.message);
    }
    
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

main().catch(console.error);

// Example usage: Initialize a new user only if they don't exist
console.log('\n--- Initializing New Users ---');

// This will create a new user with default opt-in values (email: true, sms: true)
const newUser = userPreferences.initializeNewUser('new.user@example.com');
console.log('New user initialized:', newUser);

// This will NOT overwrite an existing user's preferences
const existingUser = userPreferences.initializeNewUser('jane.doe@example.com', true, false);
console.log('Existing user initialization result:', existingUser);

// Initialize a user with custom opt-in values
const customUser = userPreferences.initializeNewUser('custom.user@example.com', true, false);
console.log('Custom user with email only:', customUser);

// Example usage: Export preferences to a custom file
console.log('\n--- Exporting Preferences ---');
const exportSuccess = userPreferences.exportPreferences('data/preferences-backup.json');
console.log('Export successful?', exportSuccess);

// Example usage: Update notification preferences for existing user
console.log('\n--- Updating Specific Notification Preferences ---');
// Update only email preference
const emailUpdate = userPreferences.updateNotificationPreferences('jane.doe@example.com', {
  email: true
});
console.log("Email-only update for Jane:", emailUpdate);

// Update only SMS preference
const smsUpdate = userPreferences.updateNotificationPreferences('john.doe@example.com', {
  sms: true
});
console.log("SMS-only update for John:", smsUpdate);

// Update both preferences at once
const bothUpdate = userPreferences.updateNotificationPreferences('marketing@company.com', {
  email: false,
  sms: false
});
console.log("Both preferences updated for marketing:", bothUpdate);

// Create new user with specific preferences
const createWithPrefs = userPreferences.updateNotificationPreferences('support@company.com', {
  email: true,
  sms: false
});
console.log("New user created with specific preferences:", createWithPrefs);

// Invalid update (should fail gracefully)
const invalidUpdate = userPreferences.updateNotificationPreferences('john.doe@example.com', {
  invalidField: true
});
console.log("Invalid update attempt:", invalidUpdate);

// Example usage: Export preferences to a custom file

// Example usage: Update existing user's preferences with enhanced validation
console.log('\n--- Updating Existing User\'s Preferences (Enhanced Validation) ---');

// Test case 1: Update a non-existent user
console.log('\nTest Case 1: Non-existent user');
const nonExistentUpdate = userPreferences.updateExistingUserPreferences(
  'non.existent@example.com', 
  { emailEnabled: false }
);
console.log('Result:', nonExistentUpdate);

// Test case 2: Valid update for an existing user
console.log('\nTest Case 2: Valid update for existing user');
const validUpdate = userPreferences.updateExistingUserPreferences(
  newUser, 
  { smsEnabled: false }
);
console.log('Result:', validUpdate);

// Test case 3: Multiple valid values
console.log('\nTest Case 3: Multiple valid values');
const multiUpdate = userPreferences.updateExistingUserPreferences(
  'jane.doe@example.com',
  { emailEnabled: true, smsEnabled: true }
);
console.log('Result:', multiUpdate);

// Test case 4: Invalid field types
console.log('\nTest Case 4: Invalid field types');
const invalidTypeUpdate = userPreferences.updateExistingUserPreferences(
  newUser,
  { emailEnabled: "yes", smsEnabled: 1 }  // Non-boolean values
);
console.log('Result:', invalidTypeUpdate);

// Test case 5: Unknown fields
console.log('\nTest Case 5: Unknown fields');
const unknownFieldUpdate = userPreferences.updateExistingUserPreferences(
  newUser,
  { 
    emailEnabled: true,
    pushEnabled: true,  // Not a valid field
    notifications: "all" // Not a valid field
  }
);
console.log('Result:', unknownFieldUpdate);

// Test case 6: Empty update object
console.log('\nTest Case 6: Empty update object');
const emptyUpdate = userPreferences.updateExistingUserPreferences(
  newUser,
  {}
);
console.log('Result:', emptyUpdate);

// Test case 7: Null or invalid input
console.log('\nTest Case 7: Null input');
const nullUpdate = userPreferences.updateExistingUserPreferences(
  newUser,
  null
);
console.log('Result:', nullUpdate);