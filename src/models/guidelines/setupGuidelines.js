import Store from '../../helpers/Store.js';
import Fetcher from '../../helpers/standardFetcher.js';
import GuidelineFetcher from './GuidelineFetcher.js';
import DiagnosisFetcher from './DiagnosisFetcher.js';
import TherapyFetcher from './TherapyFetcher.js';
import DiagnosisClassFetcher from './DiagnosisClassFetcher.js';

/**
 * Gets guidelines and all their related data (therapies, diagnoses etc.) from server and returns
 * the ready guidelineStore.
 * @param  {Object} config                  Config that contains API URLs
 * @param  {Object} config.endpoints        Object with API URLs. See below for all keys that are
 *                                          needed
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
    config,
    guidelineStore,
    bacteriaStore,
    antibioticsStore,
    handleError,
) {

    if (!config || !config.endpoints) {
        throw new Error(`setupGuidelines: Config or config.endpoints missing; is ${JSON.stringify(config)}.`);
    }
    const { endpoints } = config;

    const urlKeys = [
        'guidelineBaseUrl',
        'diagnosisClass',
        'therapyPriorities',
        'therapyCompounds',
        'diagnosisBacteria',
        'diagnoses',
        'guidelines',
        'therapies',
    ];
    const notAllAvailable = urlKeys.filter(key => !Object.keys(endpoints).includes(key));
    if (notAllAvailable.length) {
        throw new Error(`setupGuidelines: Keys ${notAllAvailable.join(', ')} missing in config.endpoints.`);
    }

    // Store all fetch promises
    const fetchPromises = [];


    // Diagnosis classes
    const diagnosisClassesStore = new Store();
    const diagnosisClassesURL = `${endpoints.guidelineBaseUrl}${endpoints.diagnosisClass}`;
    const diagnosisClassesFetcher = new DiagnosisClassFetcher(
        diagnosisClassesURL,
        diagnosisClassesStore,
    );
    fetchPromises.push(diagnosisClassesFetcher.getData());

    // Therapy priority
    const therapyPriorityStore = new Store();
    const therapyPriorityURL = `${endpoints.guidelineBaseUrl}${endpoints.therapyPriorities}`;
    const therapyPriorityFetcher = new Fetcher(therapyPriorityURL, therapyPriorityStore);
    fetchPromises.push(therapyPriorityFetcher.getData());

    // Therapy compound
    const therapyCompoundsStore = new Store();
    const therapyCompoundsURL = `${endpoints.guidelineBaseUrl}${endpoints.therapyCompounds}`;
    const therapyCompoundsFetcher = new Fetcher(therapyCompoundsURL, therapyCompoundsStore);
    fetchPromises.push(therapyCompoundsFetcher.getData());

    // Diagnoses bacteria mapping
    const diagnosesBacteriaStore = new Store();
    const diagnosesBacteriaURL = `${endpoints.guidelineBaseUrl}${endpoints.diagnosisBacteria}`;
    const diagnosesBacteriaFetcher = new Fetcher(diagnosesBacteriaURL, diagnosesBacteriaStore);
    fetchPromises.push(diagnosesBacteriaFetcher.getData());

    // Therapy
    const therapiesStore = new Store();
    const therapiesURL = `${endpoints.guidelineBaseUrl}${endpoints.therapies}`;
    const therapiesFetcher = new TherapyFetcher(
        therapiesURL,
        therapiesStore,
        undefined,
        [therapyPriorityStore, therapyCompoundsStore, antibioticsStore],
        handleError,
    );
    fetchPromises.push(therapiesFetcher.getData());

    // Diagnoses
    const diagnosesStore = new Store();
    const diagnosesURL = `${endpoints.guidelineBaseUrl}${endpoints.diagnoses}`;
    const diagnosesFetcher = new DiagnosisFetcher(
        diagnosesURL,
        diagnosesStore,
        undefined,
        [diagnosisClassesStore, diagnosesBacteriaStore, bacteriaStore, therapiesStore],
        handleError,
    );
    fetchPromises.push(diagnosesFetcher.getData());

    // Guidelines
    const guidelinesURL = `${endpoints.guidelineBaseUrl}${endpoints.guidelines}`;
    const guidelineFetcher = new GuidelineFetcher(
        guidelinesURL,
        guidelineStore,
        undefined,
        [diagnosesStore],
    );
    fetchPromises.push(guidelineFetcher.getData());

    return Promise.all(fetchPromises);

}
