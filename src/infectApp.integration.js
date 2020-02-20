import test from 'tape';
import nodeFetch from 'node-fetch';
import fetchMock from 'fetch-mock';
import { toJS } from 'mobx';
import InfectApp from './infectApp';

// Test main app against the real API (to test integration/keep things simple

// Returns endpoint object; this allows us to modify endpoints before we pass them to the factory
// function that creates the getURL method
function getEndpoints() {
    return {
        bacteria: 'pathogen.bacterium',
        antibiotics: 'substance.compound',
        data: 'rda.data',
        substanceClasses: 'substance.substanceClass',
        regions: 'generics.region',
        hospitalStatus: 'generics.hospitalStatus',
        diagnosisClass: 'diagnosisClass',
        counter: 'rda.configuration',
        therapyPriorities: 'therapyPriority',
        therapyCompounds: 'therapy_compound',
        diagnosisBacteria: 'diagnosis_bacterium',
        animals: 'generics.animal',
        diagnoses: 'diagnosis',
        guidelines: 'guideline',
        therapies: 'therapy',
        config: 'config',
    };
}

function getScopes() {
    return {
        tenant: 'tenant/v1',
        coreData: 'core-data/v1',
        rda: 'rda/v2',
        guideline: 'guideline/v1',
    };
}

function factorGetURLFunction(scopes, endpoints) {

    return (scope, endpoint) => {
        const url = `https://api.beta.infect.info/${scopes[scope]}/${endpoints[endpoint]}`;
        // console.log('URL for %s/%s is %s', scope, endpoint, url);
        return url;
    };

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



async function testInvalidApiCall(getURL, t, invalidEndpointName) {
    const app = new InfectApp({ getURL });
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
    if (containsCorrectError.length !== 1) {
        console.log(invalidEndpointName, app.notificationCenter.notifications.slice());
    }
    t.is(containsCorrectError.length, 1);
}




test('doesn\'t throw with valid config', (t) => {
    mockFetch();
    const getURL = factorGetURLFunction(getScopes(), getEndpoints());
    const app = new InfectApp({ getURL });
    app.initialize().then(() => {
        // Errors are handled by notification center and not re-thrown. Let's check if there were
        // any issues
        t.is(app.notificationCenter.notifications.length, 0);
        t.end();
        resetFetch();
    });
});



test('does not fail if preview data parameter is set', (t) => {
    mockFetch();
    const getURL = factorGetURLFunction(getScopes(), getEndpoints());
    const app = new InfectApp({ getURL, showPreviewData: true });
    app.initialize().then(() => {
        // Errors are handled by notification center and not re-thrown. Let's check if there were
        // any issues
        t.is(app.notificationCenter.notifications.length, 0);
        t.end();
        resetFetch();
    });
});



test('throws with any invalid config', (t) => {

    mockFetch();

    // This displays a lot of errors in the console; send them to the sink for this test or
    // test output will be barely readable.
    const originalConsoleError = console.error;
    console.error = () => {};

    const endpoints = getEndpoints();

    // Create a promise for every bad endpoint; execute one promise after another, at the end
    // restore everything and end test.
    const promises = Object.keys(endpoints).map((endpointName) => {
        const invalidEndpoints = {
            ...endpoints,
            [endpointName]: 'invalid-endpoint',
        };
        return testInvalidApiCall(
            factorGetURLFunction(getScopes(), invalidEndpoints),
            t,
            endpointName,
        );
    });

    Promise.all(promises).then(() => {
        resetFetch();
        console.error = originalConsoleError;
        t.end();
    });

});



test('errors with guidelines are handled internally', async(t) => {

    mockFetch();

    // Fake 404 on guidelines
    const scopes = getScopes();
    scopes.guideline = 'invalid-endpoint';

    const getURL = factorGetURLFunction(scopes, getEndpoints());
    const app = new InfectApp({ getURL });
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


test('exposes guidelineSelectedFiltersBridge', (t) => {
    mockFetch();
    const app = new InfectApp(factorGetURLFunction(getEndpoints()));
    t.is(typeof app.guidelineRelatedFilters, 'object');
    t.doesNotThrow(() => app.guidelineRelatedFilters.selectFiltersRelatedToSelectedDiagnosis());
    t.end();
});
