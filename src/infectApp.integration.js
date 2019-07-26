import test from 'tape';
import InfectApp from './infectApp';
import nodeFetch from 'node-fetch';
import fetchMock from 'fetch-mock';

// Test main app against the real API (to test integration/keep things simple


function getConfig() {
    const config = {
        endpoints: {
            apiPrefix: 'https://rda.infect.info/',
            bacteria: 'pathogen.bacterium',
            antibiotics: 'substance.compound',
            resistances: 'rda.data',
            substanceClasses: 'substance.substanceClass',
            regions: 'generics.region',
            countries: 'generics.country',
            ageGroups: 'generics.ageGroup',
            hospitalStatus: 'generics.hospitalStatus',
            guidelineBaseUrl: 'http://guidelines.infect.info/v1/',
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
    return config;
}

let originalFetch;
function mockFetch() {
    // Make fetch available to node
    if (!originalFetch) originalFetch = global.fetch;
    global.fetch = nodeFetch;
}

function resetFetch() {
    global.fetch = originalFetch;
}

function testInvalidApiCall(config, t) {
    const app = new InfectApp(config);
    return app.initialize().then(() => {
        console.log('Call succeeded; this should not happen!');
    }, (err) => {
        // If first arg of then is called, all's fine (did not throw)
        t.is(err.message.includes('HTTP status 404'), true);
        return err.message;
    });
}


test('doesn\'t throw with valid config', (t) => {
    mockFetch();
    const app = new InfectApp(getConfig());
    app.initialize().then(() => {
        // If first arg of then is called, all's fine (did not throw)
        t.pass();
        t.end();
        resetFetch();
    });


});


test('throws with any invalid config', (t) => {

    mockFetch();

    // Only test fields that are called in intialize.
    const relevantFields = ['bacteria', 'antibiotics', 'resistances', 'substanceClasses',
        'regions', 'countries', 'ageGroups', 'hospitalStatus'];

    // Create a promise for every bad endpoint; execute one promise after another, at the end
    // restore everything and end test.
    const promises = relevantFields.map((field) => {
        const invalidConfig = getConfig();
        invalidConfig.endpoints[field] = 'nooooope!';
        return testInvalidApiCall(invalidConfig, t);
    });

    const allPromises = promises.reduce((prev, item) => prev.then(() => item), Promise.resolve());

    allPromises.then(() => {
        resetFetch();
        t.end();
    });

});



test('errors with guidelines are handled internally', async(t) => {

    mockFetch();

    // Fake 404 on guidelines
    const config = getConfig();
    config.endpoints.guidelines = 'invalidURL';

    const app = new InfectApp(config);
    try {
        await app.initialize();
        const { errors } = app.errorHandler;
        t.is(errors.length, 1);
        t.is(errors[0].message.includes('Guidelines could not be fetched from server'), true);
    } catch (err) {
        console.log('Error is %o', err);
        t.fail('Guidelines should not throw');
    }
    t.end();

});

