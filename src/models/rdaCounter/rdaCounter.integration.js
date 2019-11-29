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
        bacteriumIds: [3],
        compoundIds: [4],
    };
    return { notifications, handler, response };
};

test('failed rda fetcher fails gracefully', (t) => {
    const { notifications, handler } = setupData();
    fetchMock.mock('/test', {
        status: 200,
        body: '["notAnObject"]',
    });
    const store = new RDACounterStore(handler);
    const fetcher = new RDACounterFetcher('/test', store, handler);
    fetcher.getData().then(() => {
        t.is(notifications.length, 1);
        t.is(notifications[0].severity, notificationSeverityLevels.warning);
        t.is(notifications[0].message.includes('you might see more data than expected'), true);
        fetchMock.restore();
        t.end();
    });
});

test('does not fail with valid data', async(t) => {
    const { notifications, handler, response } = setupData();
    fetchMock.mock('/test', {
        status: 200,
        body: JSON.stringify(response),
    });
    const store = new RDACounterStore(handler);
    const fetcher = new RDACounterFetcher('/test', store, handler);
    await fetcher.getData();
    t.is(notifications.length, 0);
    fetchMock.restore();
    t.end();
});

test('store fails gracefully with invalid data', (t) => {
    // Check if it fails on any invalid endpoint
    const calls = ['bacteriumIds', 'compoundIds', 'regionIds', 'ageGroupIds'].map((type) => {
        const { response, notifications, handler } = setupData();
        // Create bad data for current type
        response[type] = 'notAnArray';
        fetchMock.mock(`/${type}`, {
            status: 200,
            body: JSON.stringify(response),
        });
        const store = new RDACounterStore(handler);
        const fetcher = new RDACounterFetcher(`/${type}`, store, handler);
        return fetcher.getData().then(() => {
            t.is(notifications[0].message.includes('of type array'), true);
            t.is(notifications[0].severity, notificationSeverityLevels.notification);
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
    const fetcher = new RDACounterFetcher('/test', store, handler);
    await fetcher.getData();
    t.deepEqual(store.hasItem(rdaCounterTypes.ageGroup, 1), true);
    t.deepEqual(store.hasItem(rdaCounterTypes.region, 2), true);
    t.deepEqual(store.hasItem(rdaCounterTypes.bacterium, 3), true);
    t.deepEqual(store.hasItem(rdaCounterTypes.antibiotic, 4), true);
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
    const fetcher = new RDACounterFetcher('/test', store, handler);
    await fetcher.getData();
    // There is no regionId data: Error is handled gracefully, hasItem returns false
    t.deepEqual(store.hasItem(rdaCounterTypes.region, 2), false);
    fetchMock.restore();
    t.end();
});

