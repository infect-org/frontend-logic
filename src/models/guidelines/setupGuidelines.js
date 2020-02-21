import Store from '../../helpers/Store.js';
import Fetcher from '../../helpers/standardFetcher.js';
import GuidelineFetcher from './GuidelineFetcher.js';
import DiagnosisFetcher from './DiagnosisFetcher.js';
import TherapyFetcher from './TherapyFetcher.js';
import DiagnosisClassFetcher from './DiagnosisClassFetcher.js';

/**
 * Gets guidelines and all their related data (therapies, diagnoses etc.) from server and returns
 * the ready guidelineStore.
 * @param  {Function} getURL                Function that returns URL for provided scope
 *                                          ('guideline') and endpoint (e.g. 'diagnoses')
 * @param  {BacteriaStore} bacteriaStore    Bacteria store; needed to resolve inducing bacteria
 *                                          for Diagnosis
 * @param  {AntibioticsStore} antibioticsStore    Antibiotics store; needed to resolve recommended
 *                                                antibiotics for a Therapy
 * @param {Function} handleError            Error handler function that we can pass an error to
 *                                          which is then displayed. Needed to handle issues that
 *                                          the user should be aware of but that should not break
 *                                          the guideline functionality; e.g. if an bacteria that
 *                                          incudes a diagnosis cannot be found.
 * @return {Promise}                        Promise; returned value is an instnace of
 *                                          GuidelineStore
 */
export default async function setupGuidelines(
    getURL,
    guidelineStore,
    bacteriaStore,
    antibioticsStore,
    handleError,
) {

    if (!getURL || typeof getURL !== 'function') {
        throw new Error(`setupGuidelines: getURL missing or not a function; is ${JSON.stringify(getURL)}.`);
    }

    // Scope for getURL function
    const guidelineScope = 'guideline';

    // Store all fetch promises
    const fetchPromises = [];


    // Diagnosis classes
    const diagnosisClassesStore = new Store();
    const diagnosisClassesFetcher = new DiagnosisClassFetcher({
        url: getURL(guidelineScope, 'diagnosisClass'),
        store: diagnosisClassesStore,
    });
    fetchPromises.push(diagnosisClassesFetcher.getData());

    // Therapy priority
    const therapyPriorityStore = new Store();
    const therapyPriorityFetcher = new Fetcher({
        url: getURL(guidelineScope, 'therapyPriorities'),
        store: therapyPriorityStore,
    });
    fetchPromises.push(therapyPriorityFetcher.getData());

    // Therapy compound
    const therapyCompoundsStore = new Store();
    const therapyCompoundsFetcher = new Fetcher({
        url: getURL(guidelineScope, 'therapyCompounds'),
        store: therapyCompoundsStore,
    });
    fetchPromises.push(therapyCompoundsFetcher.getData());

    // Diagnoses bacteria mapping
    const diagnosesBacteriaStore = new Store();
    const diagnosesBacteriaFetcher = new Fetcher({
        url: getURL(guidelineScope, 'diagnosisBacteria'),
        store: diagnosesBacteriaStore,
    });
    fetchPromises.push(diagnosesBacteriaFetcher.getData());

    // Therapy
    const therapiesStore = new Store();
    const therapiesFetcher = new TherapyFetcher({
        url: getURL(guidelineScope, 'therapies'),
        store: therapiesStore,
        dependentStores: [therapyPriorityStore, therapyCompoundsStore, antibioticsStore],
        handleError,
    });
    fetchPromises.push(therapiesFetcher.getData());

    // Diagnoses
    const diagnosesStore = new Store();
    const diagnosesFetcher = new DiagnosisFetcher({
        url: getURL(guidelineScope, 'diagnoses'),
        store: diagnosesStore,
        dependentStores: [
            diagnosisClassesStore,
            diagnosesBacteriaStore,
            bacteriaStore,
            therapiesStore,
        ],
        handleError,
    });
    fetchPromises.push(diagnosesFetcher.getData());

    // Guidelines
    const guidelineFetcher = new GuidelineFetcher({
        url: getURL(guidelineScope, 'guidelines'),
        store: guidelineStore,
        dependentStores: [diagnosesStore],
    });
    fetchPromises.push(guidelineFetcher.getData());

    return Promise.all(fetchPromises);

}
