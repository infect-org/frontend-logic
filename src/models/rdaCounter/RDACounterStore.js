import { observable, makeObservable } from 'mobx';
import BaseStore from '../../helpers/BaseStore.js';
import rdaCounterTypes from './rdaCounterTypes.js';
import notificationSeverityLevels from '../notifications/notificationSeverityLevels.js';

export default class RDACounterStore extends BaseStore {

    data = new Map();

    constructor(handleException) {
        super();

        makeObservable(this, {
            data: observable
        });

        this.handleException = handleException;
    }

    /**
     * Set data to counters passed in
     * @param {Object.<string,number[]>} data    IDs that are present in unfiltered RDA data set
     *                                           and their type (e.g. bacterium)
     */
    set(field, validIds) {

        if (!Array.isArray(validIds)) {
            // If data is not an array for given field, just ignore it. Use a warning as
            // INFECT will still work correctly (but display unnecessary information)
            this.handleException({
                severity: notificationSeverityLevels.warning,
                message: `RDACounterStore: RDA counter data for field ${field} should be an array, is ${JSON.stringify(validIds)} instead.`,
            });
            return;
        }

        // Unknown field
        if (!Object.values(rdaCounterTypes).includes(field)) {
            // If field is invalid, just discard it; INFECTD will still work
            this.handleException({
                severity: notificationSeverityLevels.warning,
                message: `RDACounterStore: RDA counter field ${field} is not known; use any of ${Object.values(rdaCounterTypes).join(', ')} instead.`,
            });
            return;
        }

        this.data[field] = validIds;

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
