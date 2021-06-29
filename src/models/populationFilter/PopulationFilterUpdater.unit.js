import test from 'tape';
import { observable, transaction } from 'mobx';
import filterTypes from '../filters/filterTypes.js';
import PopulationFilterUpdater from './PopulationFilterUpdater.js';
import Store from '../../helpers/Store.js';

function setupData() {

    const selectedFilters = {
        // selectedFilter uses a shallow array
        filters: observable.array([], { deep: false }),
        getFiltersByType(type) {
            return this.filters.filter(item => item.type === type);
        },
    };

    // Fake implementation of ResistancesFetcher
    const resistancesFetcherFilters = [];
    const resistancesFetcher = {
        getDataForFilters(filters) {
            resistancesFetcherFilters.push(filters);
        },
    };

    return { selectedFilters, resistancesFetcher, resistancesFetcherFilters };
}

test('creates correct headers', (t) => {
    const { selectedFilters, resistancesFetcher, resistancesFetcherFilters } = setupData();
    const updater = new PopulationFilterUpdater(resistancesFetcher, selectedFilters);
    updater.setup();


    // Add region filter
    selectedFilters.filters.push({
        type: filterTypes.region,
        value: 5,
    });
    t.deepEqual(resistancesFetcherFilters, [{
        regionIds: [5],
        patientSettingIds: [],
        animalIds: [],
        ageGroupIntervals: [],
        sampleSourceIds: [],
    }]);


    // Add other filters (hospitalStatus/patientSetting and animal)
    selectedFilters.filters.push({
        type: filterTypes.hospitalStatus,
        value: 4,
    });
    selectedFilters.filters.push({
        type: filterTypes.animal,
        value: 3,
    });
    selectedFilters.filters.push({
        type: filterTypes.sampleSource,
        value: 7,
    });
    t.deepEqual(resistancesFetcherFilters.slice().pop(), {
        regionIds: [5],
        patientSettingIds: [4],
        animalIds: [3],
        ageGroupIntervals: [],
        sampleSourceIds: [7],
    });


    // Non-related filter: Should not update
    selectedFilters.filters.push({
        type: 'somethingElse',
        value: 5,
    });
    // Was called 3 times (for all relevant filter changes above)
    t.equal(resistancesFetcherFilters.length, 4);

    // Remove filters
    selectedFilters.filters.clear();
    t.deepEqual(resistancesFetcherFilters.slice().pop(), {
        regionIds: [],
        patientSettingIds: [],
        animalIds: [],
        ageGroupIntervals: [],
        sampleSourceIds: [],
    });

    t.end();
});


// ageGroups comes from the tenantConfig endpoint and is therefore – other than all other filters –
// tenant specific. Also, ageGroups are converted to a range of days. Therefore, we test ageGroups
// separately.
test('creates correct headers for ageGroups', (t) => {
    const { selectedFilters, resistancesFetcher, resistancesFetcherFilters } = setupData();
    const ageGroupStore = new Store();
    ageGroupStore.add({ id: 5, daysFrom: 1, daysTo: 7 });
    ageGroupStore.add({ id: 7, daysFrom: 10, daysTo: 11 });

    const updater = new PopulationFilterUpdater(resistancesFetcher, selectedFilters, ageGroupStore);
    updater.setup();

    // Add ageGroupFilters
    selectedFilters.filters.push({
        type: filterTypes.ageGroup,
        value: 5,
    });
    t.deepEqual(
        resistancesFetcherFilters.slice().pop().ageGroupIntervals,
        [{ daysFrom: 1, daysTo: 7 }],
    );

    // Add additional filter
    selectedFilters.filters.push({
        type: filterTypes.ageGroup,
        value: 7,
    });
    t.deepEqual(
        resistancesFetcherFilters.slice().pop().ageGroupIntervals,
        [{ daysFrom: 1, daysTo: 7 }, { daysFrom: 10, daysTo: 11 }],
    );

    // Remove ageGroupFilters
    selectedFilters.filters.splice(0, 2);
    t.deepEqual(
        resistancesFetcherFilters.slice().pop().ageGroupIntervals,
        [],
    );

    t.end();
});



test('uses preview data if corresponding constructor argument is used', (t) => {

    const { selectedFilters, resistancesFetcher } = setupData();
    const updater = new PopulationFilterUpdater(
        resistancesFetcher,
        selectedFilters,
        undefined,
        () => {},
        ['preview', 'active'],
    );
    updater.setup();

    t.deepEqual(updater.filterHeaders.dataVersionStatusIdentifier, ['preview', 'active']);

    t.end();

});




test('handles errors through handleError', (t) => {
    const errors = [];
    const resistancesFetcher = {
        getDataForFilters: () => { throw new Error('someError'); },
    };
    const { selectedFilters } = setupData();
    const updater = new PopulationFilterUpdater(
        resistancesFetcher,
        selectedFilters,
        {},
        err => errors.push(err),
    );
    updater.setup();
    // Errors only happen when we fetch data; therefore we have to change the filters
    selectedFilters.filters.push({
        type: filterTypes.region,
        value: 5,
    });
    t.is(errors.length, 1);
    t.is(errors[0].message.includes('someError'), true);
    t.end();
});

