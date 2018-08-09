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

test('passes fetch options to fetch call', (t) => {
	fetchMock.mock('/test', { status: 200, body: [] });
	const store = new Store();
	const fetcher = new Fetcher('/test', store, { headers: { 'accept-language': 'fr' } });
	fetcher.getData();
	// Call done
	setTimeout(() => {
		// Check if request got back 200 (only happens when headers are passed)
		//t.equals(store.status.identifier, 'ready'); 
		t.deepEquals(fetchMock.lastCall()[1], {
			headers: { 'accept-language': 'fr' },
			cache: 'no-store',
			credentials: 'include',
		});
		fetchMock.restore();
		t.end();
	});

});

test('updates status on store', (t) => {
	fetchMock.mock('/test', { status: 200, body: [] });
	const store = new Store();
	const fetcher = new Fetcher('/test', store);
	fetcher.getData();
	t.equals(store.status.identifier, 'loading');
	// Call done
	setTimeout(() => {
		t.equals(store.status.identifier, 'ready');
		fetchMock.restore();
		t.end();
	});
});

test('updates status on store on fail', (t) => {
	fetchMock.mock('/test', { status: 400, body: [] });
	const store = new Store();
	const fetcher = new Fetcher('/test', store);
	// getData rejects
	fetcher.getData().then(() => {}, (err) => {
		t.equals(err.message.indexOf('status 400') > -1, true);
		t.equals(store.status.identifier, 'error');
		fetchMock.restore();
		t.end();
	});
});

test('waits for dependent stores', (t) => {
	fetchMock.mock('/test', { status: 200, body: [] });
	const store = new Store();
	const dependentStore = new Store();
	let resolver;
	dependentStore.setFetchPromise(new Promise((resolve) => { resolver = resolve; }));
	const fetcher = new Fetcher('/test', store, undefined, [dependentStore]);
	fetcher.getData();
	setTimeout(() => {
		t.equals(store.status.identifier, 'loading');
		resolver();
		setTimeout(() => {			
			t.equals(store.status.identifier, 'ready');
			fetchMock.restore();
			t.end();
		}, 10);
	}, 20);
});

test('handles default data correctly', (t) => {
	fetchMock.mock('/test', { status: 200, body: [{ number: 1, id: 1}, {number: 2, id: 2}] });
	const store = new Store();
	const fetcher = new Fetcher('/test', store);
	fetcher.getData();
	setTimeout(() => {
		t.equals(store.get().size, 2);
		fetchMock.restore();
		global.fetch = originalFetch;
		t.end();
	}, 0);
});

