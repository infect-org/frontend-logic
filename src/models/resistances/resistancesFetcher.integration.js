import test from 'tape';
import fetchMock from 'fetch-mock';
import ResistancesFetcher from './resistancesFetcher';
import Store from '../../helpers/Store.js';
import Bacterium from '../bacteria/bacterium';
import storeStatus from '../../helpers/storeStatus.js';
import resistanceTypes from './resistanceTypes.js';

// Fetch-mock does not reset itself if there's no global fetch
const originalFetch = global.fetch;

function setupStores() {
    const antibiotics = {
        status: { identifier: storeStatus.ready },
        get() {
            return {
                values() {
                    return [{
                        name: 'Penicillin G',
                        identifier: 'penicillin g',
                        id: 4,
                    }];
                },
            };
        },
    };
    const bacteria = {
        status: { identifier: storeStatus.ready },
        get() {
            return {
                values() {
                    return [
                        new Bacterium(5, 'Acinetobacter sp.'),
                        new Bacterium(6, 'Achromobacter spp.'),
                    ];
                },
            };
        },
        remove() {},
    };
    return {
        bacteria,
        antibiotics,
    };
}

function setupBodyData() {
    return {
        justSomeProperty: true,
        values: [{
            microorganismId: 5,
            compoundSubstanceId: 4,
            resistanceQualitativeCount: 100,
            resistantPercent: 100,
            confidenceInterval: {
                lowerBound: 75,
                upperBound: 100,
            },
            resistant: 20,
            intermediate: 30,
            susceptible: 50,
        }],
    };
}

test('handles resistance data correctly', async(t) => {
    fetchMock.mock('/test', {
        status: 200,
        body: setupBodyData(),
    });
    const { antibiotics, bacteria } = setupStores();
    const store = new Store([], () => 2);
    const stores = [antibiotics, bacteria];
    const errors = [];
    const fetcher = new ResistancesFetcher({
        url: '/test',
        store,
        dependentStores: stores,
        handleError: err => errors.push(err),
    });
    await fetcher.getData();
    t.equals(store.get().size, 1);
    const result = store.getById(2);
    t.equals(result.antibiotic.name, 'Penicillin G');
    t.equals(result.bacterium.name, 'Acinetobacter sp.');
    t.equals(result.values.length, 1);
    t.equals(result.values[0].sampleSize, 100);
    t.equals(result.values[0].resistant, 20);
    t.equals(errors.length, 0);
    fetchMock.restore();
    t.end();
});


test('handles multiple values in resistance data', async(t) => {
    const body = {
        values: [{
            microorganismId: 5,
            compoundSubstanceId: 4,
            resistanceMICCount: 100,
            resistanceDiscDiffusionCount: 20,
        }],
    };
    fetchMock.mock('/test', {
        status: 200,
        body,
    });
    const { antibiotics, bacteria } = setupStores();
    const store = new Store([], () => 2);
    const stores = [antibiotics, bacteria];
    const errors = [];
    const fetcher = new ResistancesFetcher({
        url: '/test',
        store,
        dependentStores: stores,
        handleError: err => errors.push(err),
    });
    await fetcher.getData();
    const result = store.getById(2);
    t.equals(result.values.length, 2);
    t.equals(result.values[0].type, resistanceTypes.mic);
    t.equals(result.values[0].sampleSize, 100);
    t.equals(result.values[1].type, resistanceTypes.discDiffusion);
    t.equals(result.values[1].sampleSize, 20);
    t.equals(errors.length, 0);
    fetchMock.restore();
    t.end();
});


test('handles filter updates', async(t) => {

    const filterData = setupBodyData();
    filterData.values[0].resistantPercent = 99;

    fetchMock
        .mock('/test?filter={"region":[3,6]}', {
            status: 200,
            body: filterData,
        })
        .mock('/test', {
            status: 200,
            body: setupBodyData(),
        });


    const { antibiotics, bacteria } = setupStores();
    const store = new Store([], () => 2);
    const stores = [antibiotics, bacteria];
    const fetcher = new ResistancesFetcher({
        url: '/test',
        store,
        dependentStores: stores,
    });

    await fetcher.getData();
    t.equals(store.getById(2).values[0].value, 1);

    await fetcher.getDataForFilters({ region: [3, 6] });
    t.equals(store.getById(2).values[0].value, 0.99);

    // const calls = fetchMock.calls();
    // console.log(JSON.stringify(calls, null, 2));

    fetchMock.restore();
    global.fetch = originalFetch;
    t.end();

});

test('handles missing antibiotics/bacteria and invalid resistances gracefully', async(t) => {

    const recordedErrors = [];
    const handleError = err => recordedErrors.push(err);

    // Create API endpoint that returns a resistance with invalid compoundSubstanceId and
    // microorganismId
    fetchMock
        .mock('/invalidBacterium', {
            status: 200,
            body: {
                values: [{
                    microorganismId: -1,
                    compoundSubstanceId: 4,
                    resistantPercent: 100,
                }],
            },
        })
        .mock('/invalidAntibiotic', {
            status: 200,
            body: {
                values: [{
                    microorganismId: 5,
                    compoundSubstanceId: -1,
                    resistantPercent: 100,
                }],
            },
        })
        .mock('/invalidResistance', {
            status: 200,
            body: {
                values: [{
                    microorganismId: 5,
                    compoundSubstanceId: 4,
                    resistanceQualitativeCount: 100,
                    resistantPercent: 100,
                    confidenceInterval: {
                        lowerBound: 75,
                        // confidenceInterval does not embrace resistantPercent – should throw
                        upperBound: 90,
                    },
                }],
            },
        });

    const { antibiotics, bacteria } = setupStores();
    const store = new Store([], () => 2);
    const stores = [antibiotics, bacteria];

    const bacteriaFetcher = new ResistancesFetcher({
        url: '/invalidBacterium',
        store,
        dependentStores: stores,
        handleError,
    });
    const antibioticsFetcher = new ResistancesFetcher({
        url: '/invalidAntibiotic',
        store,
        dependentStores: stores,
        handleError,
    });
    const invalidResistanceFetcher = new ResistancesFetcher({
        url: '/invalidResistance',
        store,
        dependentStores: stores,
        handleError,
    });

    await bacteriaFetcher.getData();
    await antibioticsFetcher.getData();
    await invalidResistanceFetcher.getData();

    t.is(recordedErrors.length, 3);
    t.is(recordedErrors[0].message.includes('Bacterium with ID -1 missing'), true);
    t.is(recordedErrors[1].message.includes('Antibiotic with ID -1 missing'), true);
    t.is(recordedErrors[2].message.includes('Resistance for Penicillin G and Acinetobacter sp. cannot be displayed'), true);
    t.end();

});

/**
 * Race condition may be given if user switches rda filters quickly; the latest data that is
 * returned from the server will be displayed; this may not be the latest filter the user set.
 */
test('prevents race conditions', async(t) => {

    const regionfilterData = setupBodyData();
    regionfilterData.values[0].resistantPercent = 99;

    fetchMock
        .mock('/test?filter={"region":[3,6]}', {
            status: 200,
            body: regionfilterData,
        })
        // Delay resolution of first call by 10ms; first call will be resolved after second call.
        .mock('/test', new Promise(resolve => setTimeout(() => {
            resolve({
                status: 200,
                body: setupBodyData(),
            });
        }), 10));


    const { antibiotics, bacteria } = setupStores();
    const store = new Store([], () => 2);
    const stores = [antibiotics, bacteria];
    const fetcher = new ResistancesFetcher({
        url: '/test',
        store,
        dependentStores: stores,
    });

    const slowFetchPromise = fetcher.getData();
    fetcher.getDataForFilters({ region: [3, 6] });

    // First promise resolves slower; wait for it. By default, it would overwrite the data that
    // was fetched later, but faster. This is exactly what should *not* happen.
    await slowFetchPromise;
    t.equals(store.getById(2).values[0].value, 0.99);
    fetchMock.restore();
    global.fetch = originalFetch;
    t.end();

});




