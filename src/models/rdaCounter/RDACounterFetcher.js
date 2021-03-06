import debug from 'debug';
import Fetcher from '../../helpers/standardFetcher.js';
import notificationSeverityLevels from '../notifications/notificationSeverityLevels.js';
import rdaCounterTypes from './rdaCounterTypes.js';

const log = debug('infect:RDACounterFetcher.js');

export default class ResistancesFetcher extends Fetcher {

    /**
    * Fetches amount of results for given filters from RDA. Is needed to
    * a) hide rows/columns with no data for the unfiltered data set of the current tenant
    * b) hide filters with no values for the current filter set (facets; e.g. animals for INFECT
    *    for humans
    * @param {function} handleException   Exception handler
    */
    constructor(options) {
        // Add dataVersionStatusIdentifiers to URL; do it here because we also need to add those
        // filters to the RDA data call (through PopulationFilterUpdater) where they need to be
        // added at run time
        const { dataVersionStatusIdentifiers } = options;
        const url = dataVersionStatusIdentifiers && dataVersionStatusIdentifiers.length ?
            `${options.url}?filter=${JSON.stringify({ dataVersionStatusIdentifier: dataVersionStatusIdentifiers })}` :
            options.url;
        super({ ...options, url });
        const { handleError } = options;
        this.handleException = handleError;
    }

    /**
    * Sets up RDACounterStore with data fetched from server.
    * @param {Array} data       Data as gotten from server
    */
    handleData(data) {

        if (!data || typeof data !== 'object' || data.constructor !== Object) {
            // Use warning, as INFECT will still work if RDACounter is missing or wrong
            this.handleException({
                severity: notificationSeverityLevels.warning,
                message: `RDACounterStore: Expected object parameter, got ${JSON.stringify(data)} instead.`,
            });
            return;
        }

        Object.entries(data).forEach(([key, value]) => {

            // API also returns some fields that we should ignore (e.g. timings, counters). Remove
            // them here.
            if (!Object.values(rdaCounterTypes).includes(key)) {
                log('Ignore %o/%o, is not part of valid types %o', key, value, rdaCounterTypes);
                return;
            }

            log('Pass data %o/%o to store', key, value);
            this.store.set(key, value);
        });

    }

}

