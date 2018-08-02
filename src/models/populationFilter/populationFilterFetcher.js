import { fetchApi } from '../../helpers/api.js';
import filterTypes from '../filters/filterTypes';
import debug from 'debug';
const log = debug('infect:PopulationFilterFetcher');

/**
 * Fetches population filters (regions, age groups) from server and initializes filterValues.
 */
export default class PopulationFilterFetcher {

    constructor(config, filterValues) {
        this.config = config;
        this.filterValues = filterValues;
    }

    /**
    * Fetches regions from server, adds them to filters and sets 'switzerland-all' as selected
    * filter which triggers the resistancesFetcher to fetch.
    */
    async init() {
        await this.setupRegions();
        await this.setupAgeGroups();
    }


    /**
     * @private
     */
    async setupRegions() {
        const url = this.config.endpoints.apiPrefix + this.config.endpoints.regions;
        const regionData = await fetchApi(url);

        regionData.data.forEach((region) => {
            // Don't add default filter (switzerland-all) to filters; will be add manually to 
            // filter list as it shouldnot be visible (and it corresponds to no filter set)
            if (region.identifier === 'switzerland-all') return;

            const regionObject = {
                id: region.id,
                // Needed only to get a nice name for the id
                name: region.name,
            };

            log('Add filter %o for region', regionObject);
            this.filterValues.addEntity(filterTypes.region, regionObject);
        });

        log('Region filters added, are %o', 
            this.filterValues.getValuesForProperty(filterTypes.region, 'id'));
    }


    /**
     * @private
     */
    async setupAgeGroups() {
        const url = this.config.endpoints.apiPrefix + this.config.endpoints.ageGroups;
        const ageGroupData = await fetchApi(url);

        ageGroupData.data.forEach((ageGroup) => {
            // Don't add default filter (switzerland-all) to filters; will be add manually to 
            // filter list as it shouldnot be visible (and it corresponds to no filter set)
            //if (region.identifier === 'switzerland-all') return;

            const ageGroupObject = {
                id: ageGroup.id,
                // Needed only to get a nice name for the id
                name: ageGroup.name,
            };

            log('Add filter %o for ageGroup', ageGroup);
            this.filterValues.addEntity(filterTypes.ageGroup, ageGroup);
        });

        log('Age group filters added, are %o', 
            this.filterValues.getValuesForProperty(filterTypes.ageGroup, 'id'));

    }



}
