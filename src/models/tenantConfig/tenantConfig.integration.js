import test from 'tape';
import fetchMock from 'fetch-mock';
import tenantTestConfig from './testData/tenantConfig.json';
import TenantConfigFetcher from './TenantConfigFetcher.js';
import TenantConfigStore from './TenantConfigStore.js';
import notificationSeverityLevels from '../notifications/notificationSeverityLevels.js';

test('fetches data, makes it available', (t) => {
    fetchMock.mock('/tenantConfig', {
        status: 200,
        body: JSON.stringify(tenantTestConfig),
    });
    const store = new TenantConfigStore();
    const fetcher = new TenantConfigFetcher({
        url: '/tenantConfig',
        store,
    });
    fetcher.getData().then(() => {

        t.deepEqual(store.getConfig('rda'), { sampleCountFilterLowerThreshold: 5 });
        t.is(store.hasFeature('guidelines'), true);

        fetchMock.restore();
        t.end();
    }, err => t.fail(err));
});

test('handles errors gracefully', (t) => {
    fetchMock.mock('/tenantConfig', {
        status: 200,
        body: '{"configuration": true}',
    });
    const exceptions = [];
    const fetcher = new TenantConfigFetcher({
        url: '/tenantConfig',
        store: new TenantConfigStore(),
        handleException: exception => exceptions.push(exception),
    });
    fetcher.getData().then(() => {
        t.is(exceptions.length, 1);
        t.is(exceptions[0].severity, notificationSeverityLevels.warning);
        fetchMock.restore();
        t.end();
    }, err => t.fail(err));

});

