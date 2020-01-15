import PopulationFilterFetcher from './PopulationFilterFetcher.js';
import Store from '../../helpers/Store.js';
import rdaCounterTypes from '../rdaCounter/rdaCounterTypes.js';
import filterTypes from '../filters/filterTypes';

/**
 * Sets up fetchers and stores for population filters. Depending on the tenant's data available
 * on RDA, some filter values (e.g. cows as animals for INFECT by anresis) may not be displayed
 * as filters; choosing them would lead to an empty matrix.
 * @param {function} getURL            Function that returns URL for a given scope and endpoint
 * @param {PropertyMap} filterValues   Structure that holds all valid filter values
 * @param {RDACounterStore} rdaCounterStore
 */
export default function(getURL, filterValues, rdaCounterStore) {

    // Scope for getURL
    const filterScope = 'coreData';

    const animalsFetcher = new PopulationFilterFetcher({
        url: getURL(filterScope, 'animals'),
        // Just pass in any store – is not used, but necessary to work
        store: new Store(),
        dependentStores: [rdaCounterStore],
        filterValues,
        rdaCounterType: rdaCounterTypes.animal,
        filterType: filterTypes.animal,
    });
    const fetchAnimals = animalsFetcher.getData();


    const hospitalStatusFetcher = new PopulationFilterFetcher({
        url: getURL(filterScope, 'hospitalStatus'),
        // Just pass in any store – is not used, but necessary to work
        store: new Store(),
        dependentStores: [rdaCounterStore],
        filterValues,
        filterType: filterTypes.hospitalStatus,
    });
    const fetchHospitalStatus = hospitalStatusFetcher.getData();


    const regionFetcher = new PopulationFilterFetcher({
        url: getURL(filterScope, 'regions'),
        // Just pass in any store – is not used, but necessary to work
        store: new Store(),
        dependentStores: [rdaCounterStore],
        filterValues,
        rdaCounterType: rdaCounterTypes.region,
        filterType: filterTypes.region,
    });
    const fetchRegions = regionFetcher.getData();


    return Promise.all([fetchAnimals, fetchHospitalStatus, fetchRegions]);

}
