import test from 'tape';
import fetchMock from 'fetch-mock';
import ResistancesFetcher from './resistancesFetcher';
import Store from '../../helpers/store';
import Bacterium from '../bacteria/bacterium';
import { observable } from 'mobx';

// Fetch-mock does not reset itself if there's no global fetch
const originalFetch = global.fetch;

function setupFetcher() {
    const antibiotics = {
        get() {
            return {
                values() {
                    return [{
                        name: 'amoxicillin name',
                        identifier: 'amoxicillin',
                        id: 4,
                    }];
                },
            };
        },
    };
    const bacteria = {
        get() {
            return {
                values() {
                    return [new Bacterium(5, 'acinetobacter sp.')];
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
            bacteriumId: 5,
            compoundId: 4,
            sampleCount: 100,
            resistantPercent: 100,
            confidenceInterval: {
                lowerBound: 75,
                upperBound: 100,
            },
        }],
    };
}

test('handles resistance data correctly', async (t) => {
    fetchMock.mock('/test', {
        status: 200,
        body: setupBodyData(),
    });
    const { antibiotics, bacteria } = setupFetcher();
    const store = new Store([], () => 2);
    const stores = {
        antibiotics,
        bacteria,
    };
    const fetcher = new ResistancesFetcher('/test', store, {}, [], stores, {
        getFiltersByType: () => {},
    });
    await fetcher.getData();
    t.equals(store.get().size, 1);
    const result = store.getById(2);
    t.equals(result.antibiotic.name, 'amoxicillin name');
    t.equals(result.bacterium.name, 'acinetobacter sp.');
    t.equals(result.values.length, 1);
    t.equals(result.values[0].sampleSize, 100);
    fetchMock.restore();
    t.end();
});


test('handles filter updates', async (t) => {

    const filterData = setupBodyData();
    filterData.values[0].resistantPercent = 99;

    fetchMock
        .mock('/test?filter={"region":[3,6]}', {
            status: 200,
            body: filterData,
        }/*, {
            headers: {
                filter: '{"region":[3,6]}',
            },
        }*/)
        .mock('/test', {
            status: 200,
            body: setupBodyData(),
        });


    const { antibiotics, bacteria } = setupFetcher();
    const store = new Store([], () => 2);
    const stores = {
        antibiotics,
        bacteria,
    };
    const fetcher = new ResistancesFetcher('/test', store, {}, [], stores, {
        getFiltersByType: () => {},
    });

    await fetcher.getData();
    t.equals(store.getById(2).values[0].value, 1);

    // Filtered data was fetched and parsed
    await fetcher.getDataForFilters({ region: [3, 6] });
    t.equals(store.getById(2).values[0].value, 0.99);

    // const calls = fetchMock.calls();
    // console.log(JSON.stringify(calls, null, 2));

    fetchMock.restore();
    global.fetch = originalFetch;
    t.end();

});



