import test from 'tape';
import NotificationCenter from './NotificationCenter.js';
import Notification from './Notification.js';

test('adds notifications', (t) => {
    const center = new NotificationCenter();
    // Error
    const error = new Error('test');
    // Valid notification
    const notification = {
        message: 'notification',
        severity: 'warning',
    };
    // Invalid notification
    const invalid = {
        message: 'invalid',
        severity: 'invalid',
    };
    center.handle(error);
    center.handle(notification);
    center.handle(invalid);
    t.is(center.notifications.length, 3);
    // Wraps error
    t.is(center.notifications[0] instanceof Notification, true);
    t.is(center.notifications[0].error instanceof Error, true);
    t.is(center.notifications[0].severity, 'error');
    // Works with notifications
    t.is(center.notifications[1].severity, notification.severity);
    t.is(center.notifications[1].message, notification.message);
    // Converts invalid notification to error
    t.is(center.notifications[2].severity, 'error');
    t.is(center.notifications[2].error instanceof Error, true);
    t.end();
});
