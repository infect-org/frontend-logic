import test from 'tape';
import fetchMock from 'fetch-mock';
import AntibioticsStore from './antibioticsStore';
import SubstanceClass from './substanceClass';
import SubstanceClassesStore from './substanceClassesStore';
import AntibioticsFetcher from './antibioticsFetcher';

// Fetch-mock does not reset itself if there's no global fetch
const originalFetch = global.fetch;

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
    return {
        apiData,
        errorHandler,
        errors,
        antibioticsStore,
        substanceClassesStore,
    };
}

test('handles antibacteria data correctly', (t) => {
    const { apiData, antibioticsStore, substanceClassesStore } = setupData();
    fetchMock.mock('/test', apiData);
    substanceClassesStore.add(new SubstanceClass(5, 'testSC'));
    const fetcher = new AntibioticsFetcher(
        '/test',
        antibioticsStore,
        {},
        [],
        substanceClassesStore,
    );
    fetcher.getData().then(() => {
        t.equals(antibioticsStore.get().size, 1);
        t.equals(antibioticsStore.getById(1).name, 'testAB');
        t.equals(antibioticsStore.getById(1).iv, true);
        t.equals(antibioticsStore.getById(1).identifier, 'testId');
        t.equals(antibioticsStore.getById(1).substanceClass.id, 5);
        fetchMock.restore();
        global.fetch = originalFetch;
        t.end();
    });
});


test('handles antibiotics with missing substance correctly', (t) => {
    const {
        apiData,
        errors,
        errorHandler,
        antibioticsStore,
        substanceClassesStore,
    } = setupData();
    apiData[0].substance = [];
    fetchMock.mock('/test', apiData);
    const fetcher = new AntibioticsFetcher(
        '/test',
        antibioticsStore,
        {},
        [],
        substanceClassesStore,
        errorHandler,
    );
    fetcher.getData().then(() => {
        t.is(errors.length, 1);
        t.is(errors[0].message.includes('has no substance data'), true);
        // Antibiotic should not be created
        t.is(antibioticsStore.getAsArray().length, 0);
        fetchMock.restore();
        global.fetch = originalFetch;
        t.end();
    });
});

test('handles antibiotics with multiple substances correctly', (t) => {
    const {
        apiData,
        errors,
        errorHandler,
        antibioticsStore,
        substanceClassesStore,
    } = setupData();
    apiData[0].substance.push({ substanceClass: { id: 6 } });
    fetchMock.mock('/test', apiData);
    substanceClassesStore.add(new SubstanceClass(5, 'testSC'));
    const fetcher = new AntibioticsFetcher(
        '/test',
        antibioticsStore,
        {},
        [],
        substanceClassesStore,
        errorHandler,
    );
    fetcher.getData().then(() => {
        t.is(errors.length, 1);
        t.is(errors[0].message.includes('has more than one substance'), true);
        // Antibiotic should be created
        t.is(antibioticsStore.getAsArray().length, 1);
        fetchMock.restore();
        global.fetch = originalFetch;
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
    } = setupData();
    apiData[0].substance[0] = {};
    fetchMock.mock('/test', apiData);
    substanceClassesStore.add(new SubstanceClass(5, 'testSC'));
    const fetcher = new AntibioticsFetcher(
        '/test',
        antibioticsStore,
        {},
        [],
        substanceClassesStore,
        errorHandler,
    );
    fetcher.getData().then(() => {
        t.is(errors.length, 1);
        t.is(errors[0].message.includes('has invalid substanceClass data'), true);
        // Antibiotic should be created
        t.is(antibioticsStore.getAsArray().length, 0);
        fetchMock.restore();
        global.fetch = originalFetch;
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
    } = setupData();
    fetchMock.mock('/test', apiData);
    const fetcher = new AntibioticsFetcher(
        '/test',
        antibioticsStore,
        {},
        [],
        substanceClassesStore,
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
        global.fetch = originalFetch;
        t.end();
    });
});



