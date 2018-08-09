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

test('throws with any invalid config', (t) => {

    mockFetch();

    // Only test fields that are called in intialize.
    const relevantFields = ['bacteria', 'antibiotics', 'resistances', 'substanceClasses',
        'regions', 'countries', 'ageGroups'];

    // Create a promise for every bad endpoint; execute one promise after another, at the end
    // restore everything and end test.
    const promises = relevantFields.map((field) => {
        const invalidConfig = getConfig();
        invalidConfig.endpoints[field] = 'nooooope!';
        return testInvalidApiCall(invalidConfig, t);
    });

    const allPromises = promises.reduce((prev, item) => prev.then(() => item), Promise.resolve());

    allPromises.then(() => {
        t.end();
        resetFetch();
    });

});


