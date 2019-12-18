import debug from 'debug';
import Fetcher from '../../helpers/standardFetcher.js';
import notificationSeverityLevels from '../notifications/notificationSeverityLevels.js';

const log = debug('infect:RDACounterFetcher.js');

export default class ResistancesFetcher extends Fetcher {

    /**
    * Fetches resistances from server, then updates ResistancesStore passed as an argument.
    * @param {function} handleException   Exception handler
    */
    constructor(options) {
        super(options);
        const { handleError } = options;
        this.handleException = handleError;
    }

    /**
    * Sets up ResistancesStore with data fetched from server.
    * @param {Array} data       Data as gotten from server
    */
    handleData(data) {
        if (typeof data !== 'object' || data === null || data.constructor !== Object) {
            // If we cannot filter, unnecessary antibiotics, bacteria etc. might be visible –
            // this is not fatal and should be handled gracefully.
            this.handleException({
                severity: notificationSeverityLevels.warning,
                message: `RDACounterFetcher: Data returned is not valid, you might see more data than expected. Data should be an object, but is ${typeof data} (${data}.)`,
            });
            return;
        }

        // Map properties (as needed) and pass them to the store
        const dataForStore = {
            ageGroupIds: data.ageGroupIds,
            regionIds: data.regionIds,
            bacteriumIds: data.bacteriumIds,
            antibioticIds: data.compoundIds,
            animalIds: data.animalIds,
        };

        log('Pass data %o to store', dataForStore);

        this.store.set(dataForStore);

    }

}

