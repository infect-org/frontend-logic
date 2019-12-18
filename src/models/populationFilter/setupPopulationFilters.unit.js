import test from 'tape';
import fetchMock from 'fetch-mock';
import setupPopulationFilters from './setupPopulationFilters.js';
import PropertyMap from '../propertyMap/propertyMap.js';
import getFilterConfig from '../filters/getFilterConfig.js';
import storeStatus from '../../helpers/storeStatus.js';
import rdaCounterTypes from '../rdaCounter/rdaCounterTypes.js';
import filterTypes from '../filters/filterTypes.js';

const setupData = () => {

    fetchMock
        .mock('/animal', {
            status: 200,
            body: JSON.stringify([{ id: 1, name: 'Cow' }, { id: 2, name: 'Pig' }]),
        })
        .mock('/region', {
            status: 200,
            body: JSON.stringify([{ id: 11, name: 'CH-West' }, { id: 12, name: 'CH-South' }]),
        })
        .mock('/ageGroup', {
            status: 200,
            body: JSON.stringify([
                { id: 21, identifier: 'Old' },
                { id: 22, identifier: 'Very Old' },
            ]),
        })
        .mock('/hospitalStatus', {
            status: 200,
            body: JSON.stringify([{ id: 31, name: 'In' }, { id: 32, name: 'Out' }]),
        });

    const config = {
        endpoints: {
            apiPrefix: '/',
            animals: 'animal',
            hospitalStatus: 'hospitalStatus',
            regions: 'region',
            ageGroups: 'ageGroup',
        },
    };

    const filterValues = new PropertyMap();
    const filterConfig = getFilterConfig();
    filterConfig.forEach((entityConfig) => {
        filterValues.addConfiguration(entityConfig.entityType, entityConfig.config);
    });

    return { filterValues, config, fetchMock };


};

/**
 * Test integration as PopulationFilterFetcher mainly ties things together
 */
test('sets up filters as expected', (t) => {

    const rdaCounterStore = {
        hasItem: () => true,
        status: {
            identifier: storeStatus.ready,
        },
    };
    const { config, filterValues } = setupData();
    const fetcher = setupPopulationFilters(config, filterValues, rdaCounterStore);

    fetcher.then(() => {
        const mapValueAndName = entry => `${entry.value}/${entry.niceValue}`;
        t.deepEqual(
            filterValues.getValuesForProperty('animal', 'id').map(mapValueAndName),
            ['1/Cow', '2/Pig'],
        );
        t.deepEqual(
            filterValues.getValuesForProperty('region', 'id').map(mapValueAndName),
            ['11/CH-West', '12/CH-South'],
        );
        t.deepEqual(
            filterValues.getValuesForProperty('ageGroup', 'id').map(mapValueAndName),
            ['21/Old', '22/Very Old'],
        );
        t.deepEqual(
            filterValues.getValuesForProperty('hospitalStatus', 'id').map(mapValueAndName),
            ['31/In', '32/Out'],
        );
        fetchMock.restore();
        t.end();
    });

});


test('uses available rdaCounter and removes entries without RDA data', (t) => {

    const rdaCounterStore = {
        status: { identifier: storeStatus.ready },
        hasItem: (type, id) => {
            if (type === rdaCounterTypes.animal && id === 2) return false;
            if (type === rdaCounterTypes.region && id === 12) return false;
            if (type === rdaCounterTypes.ageGroup && id === 22) return false;
            return true;
        },
    };
    const { config, filterValues } = setupData();
    const fetcher = setupPopulationFilters(config, filterValues, rdaCounterStore);

    fetcher.then(() => {
        const mapValueAndName = entry => `${entry.value}/${entry.niceValue}`;
        t.deepEqual(
            filterValues.getValuesForProperty('animal', 'id').map(mapValueAndName),
            ['1/Cow'],
        );
        t.deepEqual(
            filterValues.getValuesForProperty('region', 'id').map(mapValueAndName),
            ['11/CH-West'],
        );
        t.deepEqual(
            filterValues.getValuesForProperty(filterTypes.ageGroup, 'id').map(mapValueAndName),
            ['21/Old'],
        );
        fetchMock.restore();
        t.end();
    });

});

