# Notification System

A flexible notification system for Node.js applications that supports multiple notification channels.

## Project Structure

- `index.js`: Main entry point for the application
- `notifications/`: Directory containing notification functionality
- `package.json`: Project configuration and dependencies
  - `index.js`: Core notification system
  - `email.js`: Email notification provider
- `package.json`: Project configuration and dependencies
- `.env.example`: Example environment variable configuration

## Getting Started

1. Clone this repository
2. Run `npm install` to install dependencies
3. Create a `.env` file based on `.env.example` with your credentials
4. Run `npm start` to start the application with actual email sending
5. For development without sending real emails, use `npm run dev`

## Environment Variables

The application uses the following environment variables:

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

In development mode or when EMAIL_MODE=mock, the system will use a mock email sender that only logs messages to the console.


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
