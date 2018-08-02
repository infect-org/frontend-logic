import test from 'tape';
import AntibioticsStore from './antibioticsStore';
import SubstanceClass from './substanceClass';
import SubstanceClassesStore from './substanceClassesStore';
import AntibioticsFetcher from './antibioticsFetcher';
import fetchMock from 'fetch-mock';

test('handles antibacteria data correctly', (t) => {
	fetchMock.mock('/test', [{
			id: 1,
			substance: [{
				substanceClass: {
					id: 5
				}
			}],
			name: 'testAB',
			intravenous: true,
			perOs: false,
			identifier: 'testId',
		}]);
	const abStore = new AntibioticsStore();
	const scStore = new SubstanceClassesStore();
	scStore.add(new SubstanceClass(5, 'testSC'));
	const fetcher = new AntibioticsFetcher('/test', abStore, {}, [], scStore);
	fetcher.getData();
	setTimeout(() => {
		t.equals(abStore.get().size, 1);
		t.equals(abStore.getById(1).name, 'testAB');
		t.equals(abStore.getById(1).iv, true);
		t.equals(abStore.getById(1).identifier, 'testId');
		t.equals(abStore.getById(1).substanceClass.id, 5);
		fetchMock.restore();
		t.end();
	});
});


test('handles special cases correctly', (t) => {
	// Prefer 'amoxicillin' in special case where 2 substance classes are available
	fetchMock.mock('/test', [{
			id: 1,
			substance: [{
				identifier: 'invalid',
			}, {
				identifier: 'amoxicillin',
				substanceClass: {
					id: 5,
				},
			}],
			name: 'testAB',
			intravenous: true,
			perOs: false,
			identifier: 'amoxicillin/clavulanate',
		}]);
	const abStore = new AntibioticsStore();
	const scStore = new SubstanceClassesStore();
	scStore.add(new SubstanceClass(-1, 'testSC'));
	const fetcher = new AntibioticsFetcher('/test', abStore, {}, [], scStore);
	fetcher.getData();
	setTimeout(() => {
		t.equals(abStore.get().size, 1);
		t.equals(abStore.getById(1).substanceClass.id, -1);
		fetchMock.restore();
		t.end();
	});
});

