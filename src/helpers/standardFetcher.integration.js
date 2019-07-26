import test from 'tape';
import fetchMock from 'fetch-mock';
import Fetcher from './standardFetcher';
import Store from './store';

// Fetch-mock does not reset itself if there's no global fetch
const originalFetch = global.fetch;

test('throws on setup if params are missing', (t) => {
    t.throws(() => new Fetcher(), /missing/);
    t.throws(() => new Fetcher('test'), /missing/);
    t.doesNotThrow(() => new Fetcher('test', {}));
    t.end();
});

test('passes fetch options to fetch call', async(t) => {
    fetchMock.mock('/test', { status: 200, body: [] });
    const store = new Store();
    const fetcher = new Fetcher('/test', store, { headers: { 'accept-language': 'fr' } });
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
    const fetcher = new Fetcher('/test', store);
    const promise = fetcher.getData();
    t.equals(store.status.identifier, 'loading');
    await promise;
    t.equals(store.status.identifier, 'ready');
    fetchMock.restore();
    t.end();
});

test('updates status on store on fail', async(t) => {
    fetchMock.mock('/test', { status: 400, body: [] });
    const store = new Store();
    const fetcher = new Fetcher('/test', store);
    try {
        await fetcher.getData();
    } catch (err) {
        t.equals(err.message.indexOf('status 400') > -1, true);
        t.equals(store.status.identifier, 'error');
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

    const fetcher = new Fetcher('/test', store, undefined, [loadingStore, initializedStore]);
    const fetchPromise = fetcher.getData();
    t.equals(store.status.identifier, 'loading');

    // Resolve promise of loading store; status should still be 'loading', as we're waiting for
    // the initialized store
    resolver();
    t.equals(store.status.identifier, 'loading');

    // Start loading second store
    let initializedStoreResolver;
    initializedStore.setFetchPromise(new Promise((resolve) => {
        initializedStoreResolver = resolve;
    }));
    t.equals(store.status.identifier, 'loading');
    initializedStoreResolver();

    // Wait for fetch to complete
    await fetchPromise;
    t.equals(store.status.identifier, 'ready');
    fetchMock.restore();
    t.end();
});

test('handles default data correctly', async(t) => {
    fetchMock.mock('/test', { status: 200, body: [{ number: 1, id: 1 }, { number: 2, id: 2 }] });
    const store = new Store();
    const fetcher = new Fetcher('/test', store);
    await fetcher.getData();
    t.equals(store.get().size, 2);
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
    const fetcher = new ExtendedFetcher('/test', store);
    await fetcher.getData();
    t.deepEquals(args, [{ url: '/test', data: [{ number: 1, id: 1 }] }]);
    fetchMock.restore();
    global.fetch = originalFetch;
    t.end();
});

