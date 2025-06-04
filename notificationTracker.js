/**
 * Tracks a notification by logging it to the console
 * @param {Object} notification - The notification object
 * @param {string} notification.userId - The ID of the user receiving the notification
 * @param {string} notification.channel - The channel the notification was sent through
 * @param {string} notification.message - The content of the notification message
 * @param {string|number} notification.timestamp - The timestamp of the notification
 */
function trackNotification({ userId, channel, message, timestamp }) {
  console.log({ userId, channel, message, timestamp });
}

module.exports = {
  trackNotification
};