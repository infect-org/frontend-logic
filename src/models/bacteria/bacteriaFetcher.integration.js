import test from 'tape';
import fetchMock from 'fetch-mock';
import BacteriaFetcher from './bacteriaFetcher';
import BacteriaStore from './bacteriaStore';
import storeStatus from '../../helpers/storeStatus.js'
import rdaCounterTypes from '../rdaCounter/rdaCounterTypes.js';

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
    const fetcher = new BacteriaFetcher({ url: '/bact', store });
    fetcher.getData().then(() => {
        t.equals(store.get().size, 1);
        t.equals(store.getById(5).name, 'testBact');
        t.equals(store.getById(5).shape, 'round');
        t.equals(store.getById(5).aerobic, true);
        t.equals(store.getById(5).gram, true);
        t.equals(store.getById(5).shortName, 'shrtnme');
        fetchMock.restore();
        t.end();
    });
});

test('removes unavailable bacteria if rdaCounter is provided', (t) => {
    fetchMock.mock('/bact', [
        { id: 1, name: 'bact1' },
        { id: 5, name: 'bact5' },
        { id: 6, name: 'bact6' },
    ]);
    const store = new BacteriaStore();
    const rdaCounter = {
        status: { identifier: storeStatus.ready },
        hasItem: (type, id) => {
            t.is(type, rdaCounterTypes.bacterium);
            return id !== 1;
        },
    };
    const fetcher = new BacteriaFetcher({ url: '/bact', store, dependentStores: [rdaCounter] });
    fetcher.getData().then(() => {
        t.equals(store.get().size, 2);
        t.end();
    });
});

