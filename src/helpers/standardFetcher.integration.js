import test from 'tape';
import fetchMock from 'fetch-mock';
import storeStatus from './storeStatus.js';
import Fetcher from './standardFetcher.js';
import Store from './Store.js';

// Fetch-mock does not reset itself if there's no global fetch
const originalFetch = global.fetch;

test('throws on setup if params are missing', (t) => {
    t.throws(() => new Fetcher(), /missing/);
    t.throws(() => new Fetcher({ url: 'test' }), /missing/);
    t.doesNotThrow(() => new Fetcher({ url: 'test', store: {} }));
    t.end();
});

test('passes fetch options to fetch call', async(t) => {
    fetchMock.mock('/test', { status: 200, body: [] });
    const store = new Store();
    const fetcher = new Fetcher({
        url: '/test',
        store,
        options: { headers: { 'accept-language': 'fr' } },
    });
    await fetcher.getData();
    t.deepEquals(fetchMock.lastCall()[1], {
        headers: { 'accept-language': 'fr' },
        cache: 'no-store',
        credentials: 'include',
    });
    fetchMock.restore();
    t.end();
});

test('updates status on store', async(t) => {
    fetchMock.mock('/test', { status: 200, body: [] });
    const store = new Store();
    const fetcher = new Fetcher({ url: '/test', store });
    const promise = fetcher.getData();
    t.equals(store.status.identifier, storeStatus.loading);
    await promise;
    t.equals(store.status.identifier, storeStatus.ready);
    fetchMock.restore();
    t.end();
});

test('updates status on store on fail', async(t) => {
    fetchMock.mock('/test', { status: 400, body: [] });
    const store = new Store();
    const fetcher = new Fetcher({ url: '/test', store });
    try {
        await fetcher.getData();
    } catch (err) {
        t.equals(err.message.indexOf('status 400') > -1, true);
        t.equals(store.status.identifier, storeStatus.error);
    }
    fetchMock.restore();
    t.end();
});

test('waits for dependent stores', async(t) => {
    fetchMock.mock('/test', { status: 200, body: [] });
    const store = new Store();

    // Add one store that is loading (status = 'loading')
    const loadingStore = new Store();
    let resolver;
    loadingStore.setFetchPromise(new Promise((resolve) => { resolver = resolve; }));

    // Add one store that data has not yet been fetched for (status = 'initialized')
    const initializedStore = new Store();

    const fetcher = new Fetcher({
        url: '/test',
        store,
        dependentStores: [loadingStore, initializedStore],
    });
    const fetchPromise = fetcher.getData();
    t.equals(store.status.identifier, storeStatus.loading);

    // Resolve promise of loading store; status should still be 'loading', as we're waiting for
    // the initialized store
    resolver();
    t.equals(store.status.identifier, storeStatus.loading);

    // Start loading second store
    let initializedStoreResolver;
    initializedStore.setFetchPromise(new Promise((resolve) => {
        initializedStoreResolver = resolve;
    }));
    t.equals(store.status.identifier, storeStatus.loading);
    initializedStoreResolver();

    // Wait for fetch to complete
    await fetchPromise;
    t.equals(store.status.identifier, storeStatus.ready);
    fetchMock.restore();
    t.end();
});

test('handles default data correctly', async(t) => {
    fetchMock.mock('/test', { status: 200, body: [{ number: 1, id: 1 }, { number: 2, id: 2 }] });
    const store = new Store();
    const fetcher = new Fetcher({ url: '/test', store });
    await fetcher.getData();
    // Check if StandardFetcher's handleData method stores data correctly
    t.deepEquals(store.get().toJS(), new Map([
        [1, { number: 1, id: 1 }],
        [2, { number: 2, id: 2 }],
    ]));
    fetchMock.restore();
    global.fetch = originalFetch;
    t.end();
});

test('getData() resolves to raw data gotten from server', async(t) => {
    const body = [{ number: 1, id: 1 }, { number: 2, id: 2 }];
    fetchMock.mock('/test', { status: 200, body });
    const store = new Store();
    const fetcher = new Fetcher({ url: '/test', store });
    const data = await fetcher.getData();
    t.deepEquals(data, body);
    fetchMock.restore();
    global.fetch = originalFetch;
    t.end();
});

test('calls handleData with data and url', async(t) => {
    fetchMock.mock('/test', { status: 200, body: [{ number: 1, id: 1 }] });
    const store = new Store();
    const args = [];
    class ExtendedFetcher extends Fetcher {
        handleData(data, url) {
            args.push({ data, url });
        }
    }
    const fetcher = new ExtendedFetcher({ url: '/test', store });
    await fetcher.getData();
    t.deepEquals(args, [{ url: '/test', data: [{ number: 1, id: 1 }] }]);
    fetchMock.restore();
    global.fetch = originalFetch;
    t.end();
});

test('whole fetch promise fails if handleData on one instance fails', async(t) => {
    fetchMock.mock('/test', { status: 200, body: [{ number: 1, id: 1 }] });
    const store = new Store();
    class ExtendedFetcher extends Fetcher {
        handleData() {
            throw new Error('Fetcher failed');
        }
    }
    const fetcher = new ExtendedFetcher({ url: '/test', store });
    try {
        await fetcher.getData();
        t.fails('Fetcher should throw');
    } catch (err) {
        t.is(err.message, 'Fetcher failed');
    }
    t.is(store.status.identifier, storeStatus.error);
    fetchMock.restore();
    global.fetch = originalFetch;
    t.end();
});

