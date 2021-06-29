import test from 'tape';
import fetchMock from 'fetch-mock';
import RDACounterFetcher from './RDACounterFetcher.js';
import RDACounterStore from './RDACounterStore.js';
import rdaCounterTypes from './rdaCounterTypes.js';
import notificationSeverityLevels from '../notifications/notificationSeverityLevels.js';

const setupData = () => {
    const notifications = [];
    const handler = exception => notifications.push(exception);
    const response = {
        // Ignore irrelevant properties
        shards: 'some',
        ageGroupIds: [1],
        regionIds: [2],
        microorganismIds: [3],
        compoundSubstanceIds: [4],
        animalIds: [5],
    };
    return { notifications, handler, response };
};

test('failed rda fetcher fails gracefully', (t) => {
    const { notifications, handler } = setupData();
    fetchMock.mock('/test', {
        status: 200,
        // Rendpoint returns invalid data (array instead of an object)
        body: '["notAnObject"]',
    });
    const store = new RDACounterStore(handler);
    const fetcher = new RDACounterFetcher({ url: '/test', store, handleError: handler });
    fetcher.getData().then(() => {
        t.is(notifications.length, 1);
        t.is(notifications[0].severity, notificationSeverityLevels.warning);
        t.is(notifications[0].message.includes('Expected object parameter'), true);
        fetchMock.restore();
        t.end();
    });
});

test('rdaCounter does not fail with valid data', async(t) => {
    const { notifications, handler, response } = setupData();
    fetchMock.mock('/test', {
        status: 200,
        body: JSON.stringify(response),
    });
    const store = new RDACounterStore(handler);
    const fetcher = new RDACounterFetcher({ url: '/test', store, handleError: handler });
    await fetcher.getData();
    t.is(notifications.length, 0);
    fetchMock.restore();
    t.end();
});

test('store fails gracefully with invalid data', (t) => {
    // Check if it fails on any invalid endpoint
    const allEndpoints = setupData().response;
    // Get all endpoints that we are actually using
    const endpoints = Object.keys(allEndpoints).filter(item => item !== 'shards');
    const calls = endpoints.map((type) => {
        const { response, notifications, handler } = setupData();
        // Create bad data for current type (string instead of an array)
        response[type] = 'notAnArray';
        fetchMock.mock(`/${type}`, {
            status: 200,
            body: JSON.stringify(response),
        });
        const store = new RDACounterStore(handler);
        const fetcher = new RDACounterFetcher({ url: `/${type}`, store, handleError: handler });
        return fetcher.getData().then(() => {
            t.is(notifications[0].message.includes('should be an array'), true);
            t.is(notifications[0].severity, notificationSeverityLevels.warning);
            fetchMock.restore();
        }, () => {
            t.fail('Should not throw');
        });
    });
    Promise.all(calls).then(() => t.end());
});

test('returns correct result for hasItem', async(t) => {
    const { handler, response } = setupData();
    fetchMock.mock('/test', {
        status: 200,
        body: JSON.stringify(response),
    });
    const store = new RDACounterStore(handler);
    const fetcher = new RDACounterFetcher({ url: '/test', store, handleError: handler });
    await fetcher.getData();
    t.deepEqual(store.hasItem(rdaCounterTypes.ageGroup, 1), true);
    t.deepEqual(store.hasItem(rdaCounterTypes.region, 2), true);
    t.deepEqual(store.hasItem(rdaCounterTypes.bacterium, 3), true);
    t.deepEqual(store.hasItem(rdaCounterTypes.antibiotic, 4), true);
    t.deepEqual(store.hasItem(rdaCounterTypes.animal, 5), true);
    fetchMock.restore();
    t.end();
});

test('hasItem does not fail if data is missing', async(t) => {
    const { handler, response } = setupData();
    delete response.regionIds;
    fetchMock.mock('/test', {
        status: 200,
        body: JSON.stringify(response),
    });
    const store = new RDACounterStore(handler);
    const fetcher = new RDACounterFetcher({ url: '/test', store, handleError: handler });
    await fetcher.getData();
    // There is no regionId data: Error is handled gracefully, hasItem returns false
    t.deepEqual(store.hasItem(rdaCounterTypes.region, 2), false);
    fetchMock.restore();
    t.end();
});

test('adds data version filters', async(t) => {
    const { handler, response } = setupData();
    fetchMock.mock(/\/test.*/, {
        status: 200,
        body: JSON.stringify(response),
    });
    const store = new RDACounterStore(handler);
    const fetcher = new RDACounterFetcher({
        url: '/test',
        store,
        handleError: handler,
        dataVersionStatusIdentifiers: ['a', 'b'],
    });
    await fetcher.getData();
    const calledURL = fetchMock.lastCall()[0];
    // There is no regionId data: Error is handled gracefully, hasItem returns false
    t.is(calledURL, '/test?filter={%22dataVersionStatusIdentifier%22:[%22a%22,%22b%22]}');
    fetchMock.restore();
    t.end();
});


