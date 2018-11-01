import test from 'tape';
import fetchMock from 'fetch-mock';
import BacteriaFetcher from './bacteriaFetcher';
import BacteriaStore from './bacteriaStore';

// Fetch-mock does not reset itself if there's no global fetch
const originalFetch = global.fetch;

test('handles bacteria data correctly', (t) => {
    fetchMock.mock('/bact', [{
        id: 5,
        name: 'testBact',
        shape: {
            name: 'round',
        },
        aerobicOptional: false,
        aerobic: true,
        shortName: 'shrtnme',
        gramPositive: true,
    }]);
    const store = new BacteriaStore();
    const fetcher = new BacteriaFetcher('/bact', store);
    fetcher.getData();
    setTimeout(() => {
        t.equals(store.get().size, 1);
        t.equals(store.getById(5).name, 'testBact');
        t.equals(store.getById(5).shape, 'round');
        t.equals(store.getById(5).aerobic, true);
        t.equals(store.getById(5).gram, true);
        t.equals(store.getById(5).shortName, 'shrtnme');
        fetchMock.restore();
        global.fetch = originalFetch;
        t.end();
    });
});
