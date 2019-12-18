import PopulationFilterFetcher from './PopulationFilterFetcher.js';
import Store from '../../helpers/Store.js';
import rdaCounterTypes from '../rdaCounter/rdaCounterTypes.js';
import filterTypes from '../filters/filterTypes';

export default function(config, filterValues, rdaCounterStore) {

    const animalsFetcher = new PopulationFilterFetcher({
        url: config.endpoints.apiPrefix + config.endpoints.animals,
        // Just pass in any store – is not used, but necessary to work
        store: new Store(),
        dependentStores: [rdaCounterStore],
        filterValues,
        rdaCounterType: rdaCounterTypes.animal,
        filterType: filterTypes.animal,
    });
    const fetchAnimals = animalsFetcher.getData();


    const ageGroupFetcher = new PopulationFilterFetcher({
        url: config.endpoints.apiPrefix + config.endpoints.ageGroups,
        // Just pass in any store – is not used, but necessary to work
        store: new Store(),
        dependentStores: [rdaCounterStore],
        filterValues,
        rdaCounterType: rdaCounterTypes.ageGroup,
        filterType: filterTypes.ageGroup,
    });
    const fetchAgeGroups = ageGroupFetcher.getData();


    const hospitalStatusFetcher = new PopulationFilterFetcher({
        url: config.endpoints.apiPrefix + config.endpoints.hospitalStatus,
        // Just pass in any store – is not used, but necessary to work
        store: new Store(),
        dependentStores: [rdaCounterStore],
        filterValues,
        filterType: filterTypes.hospitalStatus,
    });
    const fetchHospitalStatus = hospitalStatusFetcher.getData();


    const regionFetcher = new PopulationFilterFetcher({
        url: config.endpoints.apiPrefix + config.endpoints.regions,
        // Just pass in any store – is not used, but necessary to work
        store: new Store(),
        dependentStores: [rdaCounterStore],
        filterValues,
        rdaCounterType: rdaCounterTypes.region,
        filterType: filterTypes.region,
    });
    const fetchRegions = regionFetcher.getData();


    return Promise.all([fetchAnimals, fetchAgeGroups, fetchHospitalStatus, fetchRegions]);

}
