import test from 'tape';
import fetchMock from 'fetch-mock';
import setupPopulationFilters from './setupPopulationFilters.js';
import PropertyMap from '../propertyMap/propertyMap.js';
import getFilterConfig from '../filters/getFilterConfig.js';
import storeStatus from '../../helpers/storeStatus.js';
import rdaCounterTypes from '../rdaCounter/rdaCounterTypes.js';

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
        .mock('/hospitalStatus', {
            status: 200,
            body: JSON.stringify([{ id: 31, name: 'In' }, { id: 32, name: 'Out' }]),
        });

    const getURL = (scope, endpoint) => {
        if (scope !== 'coreData') return false;
        const endpoints = {
            animals: 'animal',
            hospitalStatus: 'hospitalStatus',
            regions: 'region',
        };
        return `/${endpoints[endpoint]}`;
    };

    const filterValues = new PropertyMap();
    const filterConfig = getFilterConfig();
    filterConfig.forEach((entityConfig) => {
        filterValues.addConfiguration(entityConfig.entityType, entityConfig.config);
    });

    return { filterValues, getURL, fetchMock };


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
    const { getURL, filterValues } = setupData();
    const fetcher = setupPopulationFilters(getURL, filterValues, rdaCounterStore);

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
            return true;
        },
    };
    const { getURL, filterValues } = setupData();
    const fetcher = setupPopulationFilters(getURL, filterValues, rdaCounterStore);

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
        fetchMock.restore();
        t.end();
    });

});

