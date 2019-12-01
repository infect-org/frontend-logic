import debug from 'debug';
import { transaction, autorun } from 'mobx';
import { fetchApi } from '../../helpers/api.js';
import filterTypes from '../filters/filterTypes';
import storeStatus from '../../helpers/storeStatus.js';
import rdaCounterTypes from '../rdaCounter/rdaCounterTypes.js';

const log = debug('infect:PopulationFilterFetcher');

/**
 * Fetches population filters (regions, age groups) from server and initializes filterValues.
 */
export default class PopulationFilterFetcher {

    /**
     * @param  {object} config                Config for URLs
     * @param  {PropertyMap} filterValues     Instance of PropertyMap that holds all filter values
     * @param  {RDACounterStore} rdaCounter   Instance of RDACounterStore that knows what data is
     *                                        available on the (unfiltered) RDA view for this
     *                                        tenant. Optional (for easier testing).
     */
    constructor(config, filterValues, rdaCounter) {
        this.config = config;
        this.filterValues = filterValues;
        this.rdaCounter = rdaCounter;
    }


    async init() {
        await this.setupRegions();
        await this.setupAgeGroups();
        await this.setupHospitalStatus();
        await this.setupAnimals();
    }

    /**
     * If an RDA Counter was provided, we should wait until it's ready before we handle the data we
     * received
     * @return {Promise}    Promise that resolves to RDACounterStore or undefined (if none was
     *                      passed)
     * @private
     */
    async waitForRDACounter() {
        if (!this.rdaCounter) return Promise.resolve();
        const { identifier } = this.rdaCounter.status;
        log('Wait for RDACounter, status is %o', identifier);
        if (identifier > storeStatus.loading) {
            return Promise.resolve(this.rdaCounter);
        }
        return new Promise((resolve) => {
            autorun((currentReaction) => {
                log('RDACounter status changed to %o', this.rdaCounter.status);
                if (this.rdaCounter.status.identifier > storeStatus.loading) {
                    resolve(this.rdaCounter);
                    currentReaction.dispose();
                }
            });
        });
    }


    /**
     * Fetches animals from server, adds the ones with RDA data to filtersValues
     * @private
     */
    async setupAnimals() {
        const url = this.config.endpoints.apiPrefix + this.config.endpoints.animals;
        const animalData = await fetchApi(url);
        const rdaCounter = await this.waitForRDACounter();

        transaction(() => {
            animalData.data.forEach((animal) => {

                // If RDACounter was passed in but current animal is not part of RDA, don't add
                // it to filters
                if (rdaCounter && !rdaCounter.hasItem(rdaCounterTypes.animal, animal.id)) {
                    log('Animal %o is not part of RDA, skip it', animal);
                    return;
                }

                log('Add filter %o for animal', animal);
                this.filterValues.addEntity(filterTypes.animal, animal);
            });
        });

        log(
            'Animal filters added, are %o',
            this.filterValues.getValuesForProperty(filterTypes.animal, 'id'),
        );

    }

    /**
     * @private
     */
    async setupRegions() {
        const url = this.config.endpoints.apiPrefix + this.config.endpoints.regions;
        const regionData = await fetchApi(url);
        const rdaCounter = await this.waitForRDACounter();

        transaction(() => {
            regionData.data.forEach((region) => {

                // If RDACounter was passed in but current animal is not part of RDA, don't add
                // it to filters
                if (rdaCounter && !rdaCounter.hasItem(rdaCounterTypes.region, region.id)) {
                    log('Region %o is not part of RDA, skip it', region);
                    return;
                }

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
        });

        log(
            'Region filters added, are %o',
            this.filterValues.getValuesForProperty(filterTypes.region, 'id'),
        );
    }


    /**
     * @private
     */
    async setupAgeGroups() {
        const url = this.config.endpoints.apiPrefix + this.config.endpoints.ageGroups;
        const ageGroupData = await fetchApi(url);
        const rdaCounter = await this.waitForRDACounter();

        ageGroupData.data.forEach((ageGroup) => {
            if (rdaCounter && !rdaCounter.hasItem(rdaCounterTypes.ageGroup, ageGroup.id)) {
                log('Age group %o is not part of RDA, skip it', ageGroup);
                return;
            }

            log('Add filter %o for ageGroup', ageGroup);
            this.filterValues.addEntity(filterTypes.ageGroup, ageGroup);
        });

        log(
            'Age group filters added, are %o',
            this.filterValues.getValuesForProperty(filterTypes.ageGroup, 'id'),
        );

    }


    /**
     * @private
     */
    async setupHospitalStatus() {
        const url = this.config.endpoints.apiPrefix + this.config.endpoints.hospitalStatus;
        const hospitalStatusData = await fetchApi(url);

        hospitalStatusData.data.forEach((hospitalStatus) => {
            log('Add filter %o for hospitalStatus', hospitalStatus);
            this.filterValues.addEntity(filterTypes.hospitalStatus, hospitalStatus);
        });

        log(
            'hospitalStatus filters added, are %o',
            this.filterValues.getValuesForProperty(filterTypes.hospitalStatus, 'id'),
        );

    }


}
