import StandardFetcher from '../../helpers/standardFetcher.js';
import notificationSeverityLevels from '../notifications/notificationSeverityLevels.js';

export default class TenantConfigFetcher extends StandardFetcher {

    constructor(options) {
        super(options);
        this.handleException = options.handleException;
    }

    handleData(data) {
        try {
            this.store.setData(data);
        } catch (err) {
            // Handle exceptions in store gracefully. Make sure that you always use defaults/
            // fallbacks if relying on a tenant config.
            this.handleException({
                severity: notificationSeverityLevels.warning,
                message: err.message,
            });
        }
    }

}
