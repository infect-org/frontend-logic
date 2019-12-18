import test from 'tape';
import nodeFetch from 'node-fetch';
import fetchMock from 'fetch-mock';
import { toJS } from 'mobx';
import InfectApp from './infectApp';

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
            ageGroups: 'generics.ageGroup',
            hospitalStatus: 'generics.hospitalStatus',
            guidelineBaseUrl: 'https://api.infect.info/guideline/v1/',
            diagnosisClass: 'diagnosisClass',
            rdaCounter: 'rda.data?functionName=infect-configuration',
            therapyPriorities: 'therapyPriority',
            therapyCompounds: 'therapy_compound',
            diagnosisBacteria: 'diagnosis_bacterium',
            diagnoses: 'diagnosis',
            guidelines: 'guideline',
            therapies: 'therapy',
            tenantConfig: 'tenant/v1/config',
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
    fetchMock.restore();
}

async function testInvalidApiCall(config, t) {
    const app = new InfectApp(config);
    await app.initialize();
    // Errors are handled within app.initialize; initalize should does therefore not throw.
    // Depending on the endpoint, multiple errors may be given; if e.g. substance classes cannot
    // be fetched, antibiotics cannot be linked to them and will also fail (and therefore display
    // an error).
    /* console.log(
        'Notifications for config %o are %o',
        config,
        toJS(app.notificationCenter.notifications),
    ); */
    const containsCorrectError = app.notificationCenter.notifications
        .filter(notification => notification.message.includes('HTTP status 404'));
    t.is(containsCorrectError.length, 1);
}




// TODO: DESKIP!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

test.skip('doesn\'t throw with valid config', (t) => {
    mockFetch();
    const app = new InfectApp(getConfig());
    app.initialize().then(() => {
        // Errors are handled by notification center and not re-thrown. Let's check if there were
        // any issues
        t.is(app.notificationCenter.notifications.length, 0);
        t.end();
        resetFetch();
    });


});


test.skip('throws with any invalid config', (t) => {

    mockFetch();

    // This displays a lot of errors in the console; send them to the sink for this test or
    // test output will be barely readable.
    const originalConsoleError = console.error;
    console.error = () => {};

    // Only test fields that are called in intialize.
    // TODO: Use all config fields available so that test automatically fails when new endpoints
    // are added. Await new config structure.
    const relevantFields = ['bacteria', 'antibiotics', 'resistances', 'substanceClasses',
        'regions', 'ageGroups', 'hospitalStatus', 'diagnosisClass',
        'therapyPriorities', 'therapyCompounds', 'diagnosisBacteria', 'diagnoses', 'therapies'];

    // Create a promise for every bad endpoint; execute one promise after another, at the end
    // restore everything and end test.
    const promises = relevantFields.map((field) => {
        const invalidConfig = getConfig();
        invalidConfig.endpoints[field] += '-nope!';
        return testInvalidApiCall(invalidConfig, t);
    });

    Promise.all(promises).then(() => {
        resetFetch();
        console.error = originalConsoleError;
        t.end();
    });

});



test.skip('errors with guidelines are handled internally', async(t) => {

    mockFetch();

    // Fake 404 on guidelines
    const config = getConfig();
    config.endpoints.guidelines = 'invalidURL';

    const app = new InfectApp(config);
    try {
        await app.initialize();
        const { notifications } = app.notificationCenter;
        t.is(notifications.length, 1);
        t.is(
            notifications[0].message.includes('Guidelines could not be fetched from server'),
            true,
        );
    } catch (err) {
        console.log('Error is %o', err);
        t.fail('Guidelines should not throw');
    }
    t.end();

});

