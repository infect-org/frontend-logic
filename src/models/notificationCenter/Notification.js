import { observable } from 'mobx';

/**
 * Notification model; needed to make hide property observable.
 */
export default class Notification {

    /**
     * Hide property can be set to true by views (React components) if message was hidden by user
     */
    @observable
    hide = false;

    /**
     * @param {Object} notification
     * @param {string} notification.message
     * @param {string} notification.severity
     * @param {Error} [notification.error]
     */
    constructor(notification) {
        this.message = notification.message;
        this.error = notification.error;
        this.severity = notification.severity;
    }
}
