import { observable, action } from 'mobx';
import debug from 'debug';
import wrapNotification from './wrapNotification.js';
import Notification from './Notification.js';

const log = debug('infect:NotificationCenter');

/**
 * Contains all errors, warnings and messages that should be displayed to the user.
 */
export default class NotificationCenter {

    /**
     * Contains all notifications that handle() was called with
     */
    @observable notifications = [];

    /**
     * Contains all valid severity levels. Notifications with different severity will be converted
     * into errors
     */
    severityLevels = ['error', 'warning', 'notification'];

    /**
     * Handles the notification
     * @param {Error|Object} notification   If object, the following properties must be passed:
     *                                      - {string} severity  One of this.severityLevels
     *                                      - {string} message   The error message
     */
    @action handle(notification) {
        const notificationModel = new Notification(wrapNotification(
            notification,
            this.severityLevels,
        ));
        log('Handle message %o', notificationModel);
        // Make sure errors are also propagated to online tools (that are mostly watching
        // console.error for output)
        if (notificationModel.severity === 'error') console.error('Handle error %o', notification);
        this.notifications.push(notificationModel);
    }

}
