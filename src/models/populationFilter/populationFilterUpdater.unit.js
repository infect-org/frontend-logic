import test from 'tape';
import { observable } from 'mobx';
import filterTypes from '../filters/filterTypes';
import PopulationFilterUpdater from './populationFilterUpdater';

function setupData() {

    const selectedFilters = {
        // selectedFilter uses a shallow array
        filters: observable.array([], { deep: false }),
        getFiltersByType(type) {
            return this.filters.filter(item => item.type === type);
        },
    };

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
    new PopulationFilterUpdater(resistancesFetcher, selectedFilters);

    // Region
    selectedFilters.filters.push({
        type: filterTypes.region,
        value: 5,
    });
    t.deepEqual(resistancesFetcherFilters, [{
        regionIds: [5],
        ageGroupIds: [],
    }]);

    // Non-related filter: Should not update
    selectedFilters.filters.push({
        type: 'somethingElse',
        value: 5,
    });
    t.equal(resistancesFetcherFilters.length, 1);

    t.end();
});
