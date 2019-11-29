import test from 'tape';
import fetchMock from 'fetch-mock';
import AntibioticsStore from './antibioticsStore.js';
import SubstanceClass from './substanceClass.js';
import SubstanceClassesStore from './substanceClassesStore.js';
import AntibioticsFetcher from './antibioticsFetcher.js';
import RDACounterStore from '../rdaCounter/RDACounterStore.js';
import rdaCounterTypes from '../rdaCounter/rdaCounterTypes.js';

function setupData() {
    const apiData = [{
        id: 1,
        substance: [{
            substanceClass: {
                id: 5,
            },
        }],
        name: 'testAB',
        intravenous: true,
        perOs: false,
        identifier: 'testId',
    }];
    const errors = [];
    const errorHandler = err => errors.push(err);
    const antibioticsStore = new AntibioticsStore();
    const substanceClassesStore = new SubstanceClassesStore();
    substanceClassesStore.setFetchPromise(new Promise(resolve => resolve()));
    const rdaCounterStore = new RDACounterStore(() => {});
    rdaCounterStore.setFetchPromise(new Promise(resolve => resolve()));
    rdaCounterStore.set({ antibioticIds: [1] });
    return {
        apiData,
        errorHandler,
        errors,
        antibioticsStore,
        rdaCounterStore,
        substanceClassesStore,
    };
}

test('handles antibiotic data correctly', (t) => {
    const {
        apiData,
        antibioticsStore,
        substanceClassesStore,
        rdaCounterStore,
    } = setupData();
    fetchMock.mock('/test', apiData);
    substanceClassesStore.add(new SubstanceClass(5, 'testSC'));
    const fetcher = new AntibioticsFetcher(
        '/test',
        antibioticsStore,
        {},
        [substanceClassesStore, rdaCounterStore],
    );
    fetcher.getData().then(() => {
        t.equals(antibioticsStore.get().size, 1);
        t.equals(antibioticsStore.getById(1).name, 'testAB');
        t.equals(antibioticsStore.getById(1).iv, true);
        t.equals(antibioticsStore.getById(1).identifier, 'testId');
        t.equals(antibioticsStore.getById(1).substanceClass.id, 5);
        fetchMock.restore();
        t.end();
    });
});


test('handles antibiotics with missing substance correctly', (t) => {
    const {
        apiData,
        errors,
        errorHandler,
        rdaCounterStore,
        antibioticsStore,
        substanceClassesStore,
    } = setupData();
    apiData[0].substance = [];
    fetchMock.mock('/test', apiData);
    const fetcher = new AntibioticsFetcher(
        '/test',
        antibioticsStore,
        {},
        [substanceClassesStore, rdaCounterStore],
        errorHandler,
    );
    fetcher.getData().then(() => {
        t.is(errors.length, 1);
        t.is(errors[0].message.includes('has no substance data'), true);
        // Antibiotic should not be created
        t.is(antibioticsStore.getAsArray().length, 0);
        fetchMock.restore();
        t.end();
    });
});

test('handles antibiotics with multiple substances correctly', (t) => {
    const {
        apiData,
        errors,
        errorHandler,
        antibioticsStore,
        rdaCounterStore,
        substanceClassesStore,
    } = setupData();
    apiData[0].substance.push({ substanceClass: { id: 6 } });
    fetchMock.mock('/test', apiData);
    substanceClassesStore.add(new SubstanceClass(5, 'testSC'));
    const fetcher = new AntibioticsFetcher(
        '/test',
        antibioticsStore,
        {},
        [substanceClassesStore, rdaCounterStore],
        errorHandler,
    );
    fetcher.getData().then(() => {
        t.is(errors.length, 1);
        t.is(errors[0].message.includes('has more than one substance'), true);
        // Antibiotic should be created
        t.is(antibioticsStore.getAsArray().length, 1);
        fetchMock.restore();
        t.end();
    });
});

test('handles antibiotics with missing substanceClass data correctly', (t) => {
    const {
        apiData,
        errors,
        errorHandler,
        antibioticsStore,
        substanceClassesStore,
        rdaCounterStore,
    } = setupData();
    apiData[0].substance[0] = {};
    fetchMock.mock('/test', apiData);
    substanceClassesStore.add(new SubstanceClass(5, 'testSC'));
    const fetcher = new AntibioticsFetcher(
        '/test',
        antibioticsStore,
        {},
        [substanceClassesStore, rdaCounterStore],
        errorHandler,
    );
    fetcher.getData().then(() => {
        t.is(errors.length, 1);
        t.is(errors[0].message.includes('has invalid substanceClass data'), true);
        // Antibiotic should be created
        t.is(antibioticsStore.getAsArray().length, 0);
        fetchMock.restore();
        t.end();
    });
});

test('handles antibiotics with missing substanceClass correctly', (t) => {
    const {
        apiData,
        errors,
        errorHandler,
        antibioticsStore,
        substanceClassesStore,
        rdaCounterStore,
    } = setupData();
    fetchMock.mock('/test', apiData);
    const fetcher = new AntibioticsFetcher(
        '/test',
        antibioticsStore,
        {},
        [substanceClassesStore, rdaCounterStore],
        errorHandler,
    );
    fetcher.getData().then(() => {
        t.is(errors.length, 1);
        t.is(
            errors[0].message.includes('AntibioticsFetcher: Substance class with ID 5 not found'),
            true,
        );
        // Antibiotic should not be created
        t.is(antibioticsStore.getAsArray().length, 0);
        fetchMock.restore();
        t.end();
    });
});



test('ignores antibiotics without RDA data', (t) => {
    const {
        apiData,
        errorHandler,
        antibioticsStore,
        substanceClassesStore,
        rdaCounterStore,
    } = setupData();
    rdaCounterStore.hasItem = (type, id) => {
        t.is(type, rdaCounterTypes.antibiotic);
        if (id === 1) return false;
        return true;
    };
    // Remove valid ID 1 from antibioticIds
    rdaCounterStore.set({ antibioticIds: [] });
    fetchMock.mock('/test', apiData);
    const fetcher = new AntibioticsFetcher(
        '/test',
        antibioticsStore,
        {},
        [substanceClassesStore, rdaCounterStore],
        errorHandler,
    );
    fetcher.getData().then(() => {
        // Item with id 1 was not added
        t.is(antibioticsStore.getAsArray().length, 0);
        fetchMock.restore();
        t.end();
    });
});

