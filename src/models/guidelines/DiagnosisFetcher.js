import debug from 'debug';
import Fetcher from '../../helpers/standardFetcher.js';
import Diagnosis from './Diagnosis.js';

const log = debug('infect:DiagnosisFetcher');

export default class DiagnosisFetcher extends Fetcher {

    /**
     * Pass same params as for Fetcher, but add handleError function that gracefully handles non-
     * critical errors
     * @param  {Function} handleError   Function that takes an Error instance as the only argument
     *                                  (and displays it to the user)
     */
    constructor(...params) {
        super(...params);
        [,,,, this.handleError] = params;
        log('handleError set to %o', this.handleError);
    }

    /**
     * Handles data.
     * @param  {Array} data         Data fetched from server
     * @override
     */
    handleData(data) {

        // Destructure stores that were passed to fetcher on init; they contain data that is
        // necessary to setup diagnosis models.
        const [
            diagnosisClasses,
            diagnosesBacteria,
            bacteria,
            therapiesStore,
        ] = this.dependentStores;

        data.forEach((diagnosis) => {

            log('Create model for diagnosis %o', diagnosis);

            // Get inducing bacteria; mappings are in store for diagnosis_bacterium, bacteria
            // are in store for bacteria.
            const inducingBacteria = diagnosesBacteria
                .getAsArray()
                // Go through diagnosis_bacterium mapping table and get all mappings that relate
                // to the current diagnosis
                .filter(mapping => mapping.id_diagnosis === diagnosis.id)
                // Get real bacterium model from bacteria store (via id_bacterium on the mapping
                // table)
                .map((mapping) => {
                    const bacterium = bacteria.getById(mapping.id_bacterium);
                    // If bacterium cannot be found, display error without crashing
                    if (!bacterium) {
                        const bacteriumMissingError = new Error(`Bacterium ${mapping.id_bacterium} could not be found. The results displayed to you will therefore not be complete for diagnosis ${diagnosis.name}.`);
                        this.handleError(bacteriumMissingError);
                    }
                    return bacterium;
                })
                // Remove entries that could not be found (error was thrown)
                .filter(bacterium => bacterium !== undefined);

            // TODO: HANDLE GENTLY if missing
            const therapies = therapiesStore
                .getAsArray()
                .filter(therapy => therapy.diagnosisId === diagnosis.id);
            therapies.forEach(therapy => therapy.removeDiagnosisId());

            log('Inducing bacteria are %o, therapies are %o', inducingBacteria, therapies);

            const diagnosisModel = new Diagnosis(
                diagnosis.id,
                diagnosis.name,
                diagnosisClasses.getById(diagnosis.id_diagnosisClass),
                inducingBacteria,
                diagnosis.markdownText,
                therapies,
            );
            /**
             * Temporarily store guideline ID on diagnosis; will be needed to resolve matching
             * diagnoses when we create the guidelines (see GuidelineFetcher)
             */
            diagnosisModel.setGuidelineId(diagnosis.id_guideline);

            this.store.add(diagnosisModel);

        });
    }
}
