import test from 'tape';
import BacteriaFetcher from './bacteriaFetcher';
import BacteriaStore from './bacteriaStore';
import fetchMock from 'fetch-mock';

test('handles bacteria data correctly', (t) => {
	fetchMock.mock('/bact', [{
		id: 5,
		name: 'testBact',
		shape: {
			name: 'round',
		},
		aerobicOptional: false,
		aerobic: true,
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
		t.end();
	});
});
