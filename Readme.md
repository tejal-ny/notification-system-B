# Notification System

A flexible notification system for Node.js applications that supports multiple notification channels.

## Project Structure
- `index.js`: Main entry point for the application
- `config.js`: Configuration management using environment variables
- `notifications/`: Directory containing notification functionality
  - `index.js`: Core notification system
  - `email.js`: Email notification provider
  - `sms.js`: SMS notification provider using Twilio
  - `validators.js`: Input validation utilities
- `package.json`: Project configuration and dependencies
- `.env.example`: Example environment variable configuration

## Supported Notification Types
- Email (via SMTP/Nodemailer)
- SMS (via Twilio)
- Push (coming soon)
- Webhook (coming soon)


## Getting Started

1. Clone this repository
2. Run `npm install` to install dependencies
3. Create a `.env` file based on `.env.example` with your credentials
4. Run `npm start` to start the application with actual email sending
5. For development without sending real emails, use `npm run dev`

## Environment Variables

The application uses the following environment variables:

### General
|
 Variable 
|
 Description 
|
 Default 
|
|
----------
|
-------------
|
---------
|
|
 NODE_ENV 
|
 Environment mode (development/production) 
|
 development 
|

### Email Configuration
|
 Variable 
|
 Description 
|
 Default 
|
|
----------
|
-------------
|
---------
|
|
 EMAIL_MODE 
|
 Email mode (mock/real) 
|
 - 
|
|
 EMAIL_HOST 
|
 SMTP server hostname 
|
 - 
|
|
 EMAIL_PORT 
|
 SMTP server port 
|
 587 
|
|
 EMAIL_SECURE 
|
 Use secure connection (true/false) 
|
 false 
|
|
 EMAIL_USER 
|
 SMTP username/email 
|
 - 
|
|
 EMAIL_PASSWORD 
|
 SMTP password 
|
 - 
|
|
 EMAIL_FROM 
|
 Default sender email address 
|
 notification-system@example.com 
|

### SMS Configuration
|
 Variable 
|
 Description 
|
 Default 
|
|
----------
|
-------------
|
---------
|
|
 SMS_MODE 
|
 SMS mode (mock/real) 
|
 - 
|
|
 TWILIO_ACCOUNT_SID 
|
 Twilio Account SID 
|
 - 
|
|
 TWILIO_AUTH_TOKEN 
|
 Twilio Auth Token 
|
 - 
|
|
 TWILIO_FROM_NUMBER 
|
 Twilio phone number to send from 
|
 - 
|

In development mode or when EMAIL_MODE/SMS_MODE=mock, the system will use mock implementations that only log messages to the console..


## Features

- Centralized notification management
- Support for multiple notification types (email, SMS, push, webhooks)
- Easily extensible notification system

## Usage

```javascript
const notificationSystem = require('./index');

// Send an email notification
notificationSystem.send(
  notificationSystem.types.EMAIL,
  'user@example.com',
  'Hello from the notification system!'
);

### Basic Usage

```javascript
const notifier = require('./index');

// Send an email notification
notifier.email.send('user@example.com', 'Hello from notification system!');

// Send an SMS notification via Twilio
notifier.sms.send('+1234567890', 'Your verification code is 123456');

// Send a push notification
notifier.push.send('device-token-123', 'You have a new message');
```

### Using the Parameter-Based Unified Interface

```javascript
const notifier = require('./index');

// Send notifications through different channels using the same interface
notifier.sendNotification('email', 'user@example.com', 'Welcome!');
notifier.sendNotification('sms', '+1234567890', 'Your code: 123456');
notifier.sendNotification('push', 'device-id', 'New message', { 
  badge: 1,
  sound: 'default'
});
```

### Using the Object-Based Dispatcher

The notification dispatcher accepts a notification object with type, recipient, message, and optional parameters:

```javascript
const notifier = require('./index');

// Create notification objects
const emailNotification = {
  type: 'email',
  recipient: 'user@example.com',
  message: 'Welcome to our service!',
  options: {
    subject: 'Welcome Message',
    from: 'noreply@example.com'
  }
};

const smsNotification = {
  type: 'sms',
  recipient: '+1234567890',
  message: 'Your verification code is 123456'
};

// Dispatch notifications
notifier.dispatch(emailNotification)
  .then(result => console.log('Email sent:', result))
  .catch(error => console.error('Email error:', error.message));

notifier.dispatch(smsNotification)
  .then(result => console.log('SMS sent:', result))
  .catch(error => console.error('SMS error:', error.message));
```

### Handling Unsupported Notification Types

```javascript
const notifier = require('./index');

// Check if a notification type is supported
if (notifier.isNotificationTypeSupported('email')) {
  console.log('Email notifications are supported');
}

// Get all supported notification types
console.log('Supported types:', notifier.getSupportedNotificationTypes());

// Handle potential errors with try/catch or promises
try {
  const result = await notifier.dispatch({
    type: 'unsupported-type',
    recipient: 'someone',
    message: 'Hello'
  });
} catch (error) {
  console.error('Expected error for unsupported type:', error.message);
  // Will output something like: "Notification type 'unsupported-type' is not supported.
  // Supported types are: email, sms, push"
}
```

### Complete Examples

## Setting Up the Project

To create this project structure on your system:

1. Create a new directory called `notification-system`
2. Create a subdirectory called `notifications`
3. Create the files with the contents provided above:
   - `index.js` in the root directory
   - `notifications/index.js` in the notifications directory
   - `package.json` in the root directory
   - `README.md` in the root directory

Once you've set up these files, you'll have a basic Node.js notification system project structure in place. You can then initialize the project with `npm install` and extend it with additional functionality as needed.
```
