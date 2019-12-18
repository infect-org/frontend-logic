import { observable, action } from 'mobx';
import debug from 'debug';
import wrapNotification from './wrapNotification.js';
import Notification from './Notification.js';
import notificationSeverityLevels from './notificationSeverityLevels.js';

const log = debug('infect:NotificationCenter');

/**
 * Contains all errors, warnings and messages that should be displayed to the user.
 * We might be tempted to export a singleton; this, however, will decrease testability as
 * notifications of other tests that are running at the same time will show up in
 * NotificationCenter.notifications.
 */
export default class NotificationCenter {

    /**
     * Contains all notifications that handle() was called with
     */
    @observable notifications = [];

    /**
     * Handles the notification
     * @param {Error|Object} notification   If object, the following properties must be passed:
     *                                      - {string} severity  One of this.severityLevels
     *                                      - {string} message   The error message
     */
    @action handle(notification) {
        const notificationModel = new Notification(wrapNotification(notification));
        log('Handle message %o', notificationModel);
        // Make sure errors are also propagated to online tools (that are mostly watching
        // console.error for output)
        if (notificationModel.severity !== notificationSeverityLevels.information) {
            console.error('NotificationCenter handled error/warning %o', notification);
        }
        this.notifications.push(notificationModel);
    }

}
