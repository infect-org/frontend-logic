import { computed, reaction } from 'mobx';
import filterTypes from '../filters/filterTypes';

/**
 * Create headers for population filters that will be passed to ResistanceFetcher. Invoke
 * ResistancesFetcher whenever population filters change. Do this in a separate class to not
 * tightly couple ResistancesFetcher and SelectedFilters.
 */
export default class PopulationFilterUpdater {

    previousFilters = '';

    constructor(resistancesFetcher, selectedFilters, handleError) {
        this.resistancesFetcher = resistancesFetcher;
        this.selectedFilters = selectedFilters;
        this.handleError = handleError;
    }

    /**
     * Main function that starts watching for changes in selectedFilters and updates data
     * accordingly.
     */
    setup() {
        this.setupWatcher();
    }

    /**
     * Converts selectedFilters to filter header for RDA call.
     * @return {Object}         Filters for RDA call
     * @private
     */
    @computed get filterHeaders() {
        const region = this.selectedFilters.getFiltersByType(filterTypes.region);
        const ageGroup = this.selectedFilters.getFiltersByType(filterTypes.ageGroup);
        const hospitalStatus = this.selectedFilters.getFiltersByType(filterTypes.hospitalStatus);
        return {
            regionIds: region.map(filter => filter.value),
            ageGroupIds: ageGroup.map(filter => filter.value),
            hospitalStatusIds: hospitalStatus.map(filter => filter.value),
        };
    }

    /**
     * Watch changes on this.filterHeaders, call ResistancesFetcher's getData
     * @private
     */
    setupWatcher() {
        reaction(() => this.filterHeaders, async(data) => {
            try {
                await this.resistancesFetcher.getDataForFilters(data);
            } catch (err) {
                this.handleError(err);
            }
        }, {
            // Overwrite existing comparator function as filterHeaders returns a *new* (and
            // therefore different) object every time it is invoked. Compare if their JSON
            // (content) stays the same.
            equals: (a, b) => JSON.stringify(a) === JSON.stringify(b),
        });
    }

}
