import debug from 'debug';
import { transaction } from 'mobx';
import StandardFetcher from '../../helpers/standardFetcher.js';

const log = debug('infect:PopulationFilterFetcher');

/**
 * Simple standardized fetcher for all population filters. Checks if filter is part of RDA (by
 * comparing its id to the ones in rdaCounterStore), then adds it to filterValues).
 */
export default class PopulationFilterFetcher extends StandardFetcher {

    /**
     * @param {object} options
     * @param {PropertyMap} options.filterValues
     * @param {string} options.rdaCounterType          rdaCounterType for current population filter
     * @param {string} options.filterType              rdaCounterType for current population filter
     */
    constructor(options) {
        super(options);
        [this.rdaCounterStore] = options.dependentStores;
        // Additional properties required by just this class
        this.filterValues = options.filterValues;
        this.rdaCounterType = options.rdaCounterType;
        this.filterType = options.filterType;
    }

    handleData(data) {
        transaction(() => {
            data.forEach((filterEntry) => {

                // If RDACounter was passed in but current filter type is not part of
                // RDA, don't add current populationFilter to filters. Is needed to e.g. prevent
                // animal filter from showing up on INFECT for humans (where users could filter
                // by only 1 animal – humans).
                if (this.rdaCounterType) {
                    if (!this.rdaCounterStore.hasItem(this.rdaCounterType, filterEntry.id)) {
                        log('Population filter %o is not part of RDA, skip it', filterEntry);
                        return;
                    }
                }

                log('Add population filter %o', filterEntry);
                this.filterValues.addEntity(this.filterType, filterEntry);
            });
        });

    }

}
