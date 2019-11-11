/**
 * Validates the notification provided and brings it into a format that errorHandler can handle.
 * If notification is not valid, it is converted into a correctly-formatted notification of severity
 * error and will display an error.
 * @param {(Error|Object)} notification      Notification that will be
 * @param {string} notification.severity     Severity level of the notification
 * @param {string} notification.message      Message that should be displayed
 * @param {string[]} severityLevels          A list of valid severity levels
 * @return {{severity: string, message: string, error?: Error}}              [description]
 */
const wrapNotification = (notification, severityLevels) => {
    if (notification instanceof Error) {
        return {
            severity: 'error',
            // Use stack for environments that support it, else message
            message: notification.stack || notification.message,
            error: notification,
        };
    }
    // Severity is missing or not valid: Convert notification to an error
    if (!notification) {
        return wrapNotification(new Error(`wrapNotification: Pass an Error or a notification that contains a message and severity property, you passed ${notification} instead.`));
    }
    if (!notification.severity || !severityLevels.includes(notification.severity)) {
        return wrapNotification(new Error(`wrapNotification: Notifications passed to ErrorHandler must include a property "severity" which is one of ${(severityLevels || []).join(', ')}; you passed ${notification.severity} instead. Your original message is ${JSON.stringify(notification)}`));
    }
    // Message is missing
    if (!notification.message) {
        return wrapNotification(new Error(`wrapNotification: Notifications passed to ErrorHandler must include a property "message" which is a string; you passed ${notification.message} instead. Your original message is ${JSON.stringify(notification)}.`));
    }
    // All fine with original notification: Return notification provided
    return {
        severity: notification.severity,
        message: notification.message,
    };
};

export default wrapNotification;
