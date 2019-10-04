import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import fetchMock from 'fetch-mock';
import test from 'tape';
import setupGuidelines from './setupGuidelines.js';
import GuidelineStore from './GuidelineStore.js';
import Store from '../../helpers/store.js';

/**
 * Tests all guideline related fetches and stores (as the all play together)
 */

const originalFetch = global.fetch;

function setupData() {


    // Get apiData: Map with key: URL and value: JSON, gotten from ./testData
    const basePath = './src/models/guidelines/testData';
    const apiData = readdirSync(basePath).reduce((prev, fileName) => {
        const content = readFileSync(join(basePath, fileName), { encoding: 'utf8' });
        const url = `https://baseUrl/${fileName.replace(/\.json$/, '')}`;
        return prev.set(url, JSON.parse(content));
    }, new Map());

    // Setup fetchMock that returns correct data for data endpoint
    const fetch = fetchMock.sandbox().mock(
        // Accept calls when URL is a valid key of apiData
        url => apiData.has(url),
        // Return corresponding apiData
        url => apiData.get(url),
    );

    // Create store and corresponding promises that can be rejected and resolved from the outside
    const antibioticsStorePromise = {};
    const antibioticsStore = new Store();
    antibioticsStore.setFetchPromise(new Promise((resolve, reject) => {
        antibioticsStorePromise.resolve = resolve;
        antibioticsStorePromise.reject = reject;
    }));
    // Add all necessary antibiotics to antibioticsStore.
    // IDs: see therapy_compound.json
    [13, 36, 17, 2].forEach(id => antibioticsStore.add({ id }));

    const bacteriaStorePromise = {};
    const bacteriaStore = new Store();
    bacteriaStore.setFetchPromise(new Promise((resolve, reject) => {
        bacteriaStorePromise.resolve = resolve;
        bacteriaStorePromise.reject = reject;
    }));
    // Add all necessary bacteria to bacteriaStore.
    // IDs: see diagnosis_bacterium.json
    [3, 34, 26, 5, 539].forEach(id => bacteriaStore.add({ id }));

    const guidelineStore = new GuidelineStore();

    const config = {
        endpoints: {
            guidelineBaseUrl: 'https://baseUrl/',
            diagnosisClass: 'diagnosisClass',
            therapyPriorities: 'therapyPriority',
            therapyCompounds: 'therapy_compound',
            diagnosisBacteria: 'diagnosis_bacterium',
            dataSources: 'dataSource',
            diagnoses: 'diagnosis',
            guidelines: 'guideline',
            therapies: 'therapy',
        },
    };

    const handledErrors = [];
    function handleError(err) {
        handledErrors.push(err);
    }

    return {
        apiData,
        fetch,
        config,
        guidelineStore,
        antibioticsStore,
        antibioticsStorePromise,
        bacteriaStore,
        bacteriaStorePromise,
        handledErrors,
        handleError,
    };

}




test('fails if config data is invalid', async(t) => {

    // No config
    try {
        await setupGuidelines();
        t.fail();
    } catch (err) {
        t.is(err.message.includes('Config or config.endpoints missing'), true);
    }

    // endpoints property missing in config
    try {
        await setupGuidelines({});
        t.fail();
    } catch (err) {
        t.is(err.message.includes('Config or config.endpoints missing'), true);
    }

    // Single/multiple endpoints missing
    try {
        await setupGuidelines({ endpoints: {} });
        t.fail();
    } catch (err) {
        t.is(err.message.includes('Keys guidelineBaseUrl'), true);
    }

    t.end();
});



test('creates all models', async(t) => {
    const {
        fetch,
        config,
        antibioticsStore,
        antibioticsStorePromise,
        bacteriaStore,
        guidelineStore,
        bacteriaStorePromise,
    } = setupData();

    global.fetch = fetch;

    const promise = setupGuidelines(
        config,
        guidelineStore,
        bacteriaStore,
        antibioticsStore,
        () => {},
    );

    setTimeout(() => {
        bacteriaStorePromise.resolve();
        antibioticsStorePromise.resolve();
    });

    await promise;

    // Correct amount of guidelines
    t.is(guidelineStore.get().size, 1);

    // Check guideline
    const [guideline] = guidelineStore.getAsArray();
    t.is(guideline.id, 1);
    t.is(guideline.name, 'SGInf-Guidelines');
    t.is(guideline.markdownDisclaimer.startsWith('*Alle*'), true);
    t.is(guideline.contactEmail, 'guidelines@infect.info');

    // Check first diagnosis for guideline
    t.is(guideline.diagnoses.length, 2);
    const [diagnosis] = guideline.diagnoses;
    t.is(diagnosis.id, 1);
    t.is(diagnosis.name, 'Komplizierte Zystitis');
    t.is(diagnosis.markdownText.startsWith('# Überlegungen'), true);
    t.is(diagnosis.diagnosisClass.id, 1);
    t.is(diagnosis.diagnosisClass.name, 'Urinary Tract');
    t.deepEquals(diagnosis.inducingBacteria, [{ id: 3 }, { id: 34 }]);
    // Check that only newest latestUpdate is used
    t.deepEquals(diagnosis.latestUpdate, {
        date: new Date(2019, 8, 9, 11, 36, 35),
        name: 'SGInf-Guidelines1',
        link: 'https://ssi.guidelines.ch/',
    });

    // Check first therapy for diagnosis
    t.is(diagnosis.therapies.length, 2);
    const [therapy] = diagnosis.therapies;
    // Make sure therapy with higher priority comes first
    t.is(therapy.id, 2);
    t.is(therapy.markdownText, 'First priority');
    t.is(therapy.priority.name, 'Erste Wahl');
    t.is(therapy.priority.order, 1);

    // Recommended antibiotics for therapy
    t.deepEquals(therapy.recommendedAntibiotics.length, 2);
    const [antibiotic] = therapy.recommendedAntibiotics;
    t.is(antibiotic.markdownText.startsWith('Ciprofloxacin 500 mg'), true);
    t.deepEquals(antibiotic.antibiotic, { id: 17 });

    global.fetch = originalFetch;
    t.end();

});


test('fails if request fails', async(t) => {
    const {
        apiData,
        config,
        antibioticsStore,
        antibioticsStorePromise,
        bacteriaStore,
        guidelineStore,
        bacteriaStorePromise,
    } = setupData();

    // Use fetchMock that does not know guideline
    const badEndpoint = 'https://baseUrl/guideline';
    fetchMock
        .mock(
            url => apiData.has(url) && url !== badEndpoint,
            url => apiData.get(url),
        )
        .mock(badEndpoint, 407);

    const promise = setupGuidelines(
        config,
        guidelineStore,
        bacteriaStore,
        antibioticsStore,
        () => {},
    );

    setTimeout(() => {
        bacteriaStorePromise.resolve();
        antibioticsStorePromise.resolve();
    });

    try {
        await promise;
        t.fail('Promise should have been rejected');
    } catch (err) {
        t.is(err.message.includes('API returned invalid HTTP status 407'), true);
    }

    fetchMock.restore();
    global.fetch = originalFetch;
    t.end();

});




// TODO: Add tests for therapies (already implemented) and other errors that are handled gently
test('fails gently if bacteria or antibiotics are missing', async(t) => {
    const {
        fetch,
        config,
        antibioticsStore,
        antibioticsStorePromise,
        bacteriaStore,
        guidelineStore,
        bacteriaStorePromise,
        handledErrors,
        handleError,
    } = setupData();

    global.fetch = fetch;

    const promise = setupGuidelines(
        config,
        guidelineStore,
        bacteriaStore,
        antibioticsStore,
        handleError,
    );

    bacteriaStore.remove(bacteriaStore.getById(3));
    // TODO: Same for others!

    setTimeout(() => {
        bacteriaStorePromise.resolve();
        antibioticsStorePromise.resolve();
    });

    await promise;

    t.is(handledErrors.length, 1);

    global.fetch = originalFetch;
    t.end();

});


