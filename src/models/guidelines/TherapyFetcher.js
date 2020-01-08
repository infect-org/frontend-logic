import debug from 'debug';
import Fetcher from '../../helpers/standardFetcher.js';
import Therapy from './Therapy.js';
import notificationSeverityLevels from '../notifications/notificationSeverityLevels.js';

const log = debug('infect:TherapyFetcher');

export default class TherapyFetcher extends Fetcher {

    /**
     * Pass same params as for Fetcher, but add handleError function that gracefully handles non-
     * critical errors
     * @param  {function} options.handleError   Function that takes an Error instance as the only
     *                                          argument (and displays it to the user)
     */
    constructor(options) {
        super(options);
        const { handleError } = options;
        this.handleError = handleError;
        log('handleError set to %o', this.handleError);
    }


    handleData(data) {
        data.forEach((therapy) => {

            log('Create model for therapy %o', therapy);

            const [
                therapyPriorityStore,
                therapyCompoundsStore,
                antibioticsStore,
            ] = this.dependentStores;

            // Get matching therapy priority from corresponding store
            // TODO: HANDLE ERROR
            const therapyPriority = therapyPriorityStore.getById(therapy.id_therapyPriority);

            // Map antibiotics to therapy through mapping table in therapyCompoundsStore
            const recommendedAntibiotics = therapyCompoundsStore
                .getAsArray()
                .filter(mapping => mapping.id_therapy === therapy.id)
                .map((mapping) => {
                    // If antibiotic does not exist in our store, display error, but don't break
                    // the app's functionality
                    const antibiotic = antibioticsStore.getById(mapping.id_compound);
                    if (!antibiotic) {
                        log('All antibiotics are', antibioticsStore.getAsArray());
                        this.handleError({
                            severity: notificationSeverityLevels.warning,
                            message: `Antibiotic ${mapping.id_compound} could not be found. The results displayed to you will therefore not be complete for therapy ${therapy.id}.`,
                        });
                        return undefined;
                    }
                    return {
                        antibiotic: antibioticsStore.getById(mapping.id_compound),
                        markdownText: mapping.markdownText,
                    };
                })
                // Remove all antibiotics that do not exist
                .filter(antibiotic => antibiotic !== undefined);

            log(
                'Priority is %o, recommended antibiotics are %o',
                therapyPriority,
                recommendedAntibiotics,
            );

            const therapyModel = new Therapy(
                therapy.id,
                recommendedAntibiotics,
                therapyPriority.priority,
                therapyPriority.name,
                therapy.markdownText,
            );

            therapyModel.setDiagnosisId(therapy.id_diagnosis);

            this.store.add(therapyModel);

        });
    }
}
