import BaseStore from '../../helpers/BaseStore.js';
import rdaCounterTypes from './rdaCounterTypes.js';
import notificationSeverityLevels from '../notifications/notificationSeverityLevels.js';

export default class RDACounterStore extends BaseStore {

    data = {};

    constructor(handleException) {
        super();
        this.handleException = handleException;
    }

    /**
     * Set data to counters passed in
     * @param {Object.<string,number[]>} data    IDs that are present in unfiltered RDA data set
     *                                           and their type (e.g. bacterium)
     */
    set(data) {
        Object.values(rdaCounterTypes).forEach((type) => {

            // Check if data is valid for every rdaCounterType
            if (!data[type] || !Array.isArray(data[type])) {
                this.handleException({
                    severity: notificationSeverityLevels.warning,
                    message: `RDACounterStore: Got different data than expected. Expected field ${type} of type array, is ${typeof data[type]} (${data[type]}) instead; the whole response is ${JSON.stringify(data)}.`,
                });
                return;
            }

            // Add data only if valid
            this.data[type] = data[type];

        });
    }

    /**
     * Returns true if a passed type/id is part of the unfiltered RDA data set, else false
     * @param {string} type    Type from rdaCounterTypes, e.g. 'bacterium'
     * @param {number} id      Id of the entity we're checking
     * @return {Boolean}       True if there's data, else false
     */
    hasItem(type, id) {
        return !!(this.data[type] && this.data[type].includes(id));
    }

}
