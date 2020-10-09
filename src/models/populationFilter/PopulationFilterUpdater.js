import debug from 'debug';
import { computed, reaction } from 'mobx';
import filterTypes from '../filters/filterTypes';

const log = debug('infect:PopulationFilterUpdater');

/**
 * Create headers for population filters that will be passed to ResistanceFetcher. Invoke
 * ResistancesFetcher whenever population filters change. Do this in a separate class to not
 * tightly couple ResistancesFetcher and SelectedFilters.
 */
export default class PopulationFilterUpdater {

    previousFilters = '';

    /**
     * @param {ResistancesFetcher} resistancesFetcher
     * @param {PropertyMap} selectedFilters
     * @param {Store} ageGroupStore
     * @param {function} handleError
     * @param {string[]} dataVersionStatusIdentifiers    Array with all identifiers that
    *                                                    should be loaded from RDA, e.g.
    *                                                    ['preview', 'active'].
     */
    constructor(
        resistancesFetcher,
        selectedFilters,
        ageGroupStore,
        handleError,
        dataVersionStatusIdentifiers,
    ) {
        this.resistancesFetcher = resistancesFetcher;
        this.selectedFilters = selectedFilters;
        this.ageGroupStore = ageGroupStore;
        this.handleError = handleError;
        this.dataVersionStatusIdentifiers = dataVersionStatusIdentifiers;
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
        const patientSetting = this.selectedFilters.getFiltersByType(filterTypes.hospitalStatus);
        const animal = this.selectedFilters.getFiltersByType(filterTypes.animal);
        const sampleSource = this.selectedFilters.getFiltersByType(filterTypes.sampleSource);
        // If dataVersionStatusIdentifiers is set, pass the values to the endpoint
        const dataVersionConfig = {};
        if (this.dataVersionStatusIdentifiers && this.dataVersionStatusIdentifiers.length) {
            dataVersionConfig.dataVersionStatusIdentifier = this.dataVersionStatusIdentifiers;
        }
        const filters = {
            regionIds: region.map(filter => filter.value),
            patientSettingIds: patientSetting.map(filter => filter.value),
            animalIds: animal.map(filter => filter.value),
            sampleSourceIds: sampleSource.map(filter => filter.value),
            ageGroupIntervals: [],
            ...dataVersionConfig,
        };

        // Add daysFrom/daysTo for ageGroups, if user filtered by ageGroups
        const ageGroupFilter = this.selectedFilters.getFiltersByType(filterTypes.ageGroup);
        if (ageGroupFilter.length) {
            const selectedAgeGroupIds = ageGroupFilter.map(({ value }) => value);
            const ageGroupsFromStore = this.ageGroupStore.getAsArray()
                .filter(item => selectedAgeGroupIds.includes(item.id));
            const ageGroupIntervals = ageGroupsFromStore.map(({ daysTo, daysFrom }) => ({
                daysTo,
                daysFrom,
            }));
            ageGroupIntervals.forEach(interval => filters.ageGroupIntervals.push(interval));
        }

        return filters;
    }

    /**
     * Watch changes on this.filterHeaders, call ResistancesFetcher's getData
     * @private
     */
    setupWatcher() {
        reaction(() => this.filterHeaders, async(data) => {
            try {
                log('Selected filters changed, new headers are %o', data);
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
