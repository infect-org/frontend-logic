import debug from 'debug';
import Fetcher from '../../helpers/standardFetcher.js';
import Antibiotic from './antibiotic.js';
import notificationSeverityLevels from '../notifications/notificationSeverityLevels.js';
import rdaCounterTypes from '../rdaCounter/rdaCounterTypes.js';

const log = debug('infect:AntibioticsFetcher');

export default class AntibioticsFetcher extends Fetcher {

    /**
     * @param {Object} config
     * @param {function} config.handleError    Error handling function
     * @param {Array} config.dependentStores   SubstanceClassStore and RDACounterStore (optional)
     */
    constructor(config = {}) {
        super(config);
        const { dependentStores, handleError } = config;
        // rdaCounter is optional (for easier testing)
        [this.substanceClasses, this.rdaCounter] = dependentStores;
        this.handleError = handleError;
    }


    handleData(data) {

        // Cone data as we're modifying it
        data.forEach((originalAntibioticData) => {

            const antibioticData = { ...originalAntibioticData };

            // If unfiltered RDA does not have any data for antibiotic, we don't display it. This
            // is not an exception, it is an expected behavior.
            if (this.rdaCounter) {
                if (!this.rdaCounter.hasItem(rdaCounterTypes.antibiotic, antibioticData.id)) {
                    log('Antibiotic %o has no RDA data, ignore it.', antibioticData);
                    return;
                }
            }

            // There are 2 special cases: amoxicillin/clavulanate and piperacillin/tazobactam
            // get a «virtual» substance class Beta-lactam + inhibitor that was programmatically
            // created in SubstanceClassFetcher
            if (
                antibioticData.identifier === 'amoxicillin/clavulanate' ||
                antibioticData.identifier === 'piperacillin/tazobactam'
            ) {
                antibioticData.substance = [{
                    substanceClass: {
                        id: -1,
                    },
                }];
            }

            log('Add antibiotic %o');

            if (!antibioticData.substance.length) {
                this.handleError({
                    severity: notificationSeverityLevels.warning,
                    message: `AntibioticsFetcher: Compound ${JSON.stringify(antibioticData)} has no substance data. Will not be displayed.`,
                });
                return;
            }

            // More than one substance. Just display error (as we won't use substances with
            // index > 0), but add antibiotic.
            if (antibioticData.substance.length > 1) {
                this.handleError({
                    severity: notificationSeverityLevels.warning,
                    message: `antibioticsFetcher: Compound ${JSON.stringify(antibioticData)} has more than one substance; this is not expected. Will not be displayed.`,
                });
            }

            // substance hasOne substanceClass – no need to validate data. But check if
            // substanceClass exists on API data. Handle gracefully.
            if (!antibioticData.substance[0].substanceClass) {
                this.handleError({
                    severity: notificationSeverityLevels.warning,
                    message: `antibioticsFetcher: Substance ${JSON.stringify(antibioticData.substance[0])} has invalid substanceClass data. Will not be displayed.`,
                });
                return;
            }
            const substanceClassId = antibioticData.substance[0].substanceClass.id;

            // Substance class does not exist: Handle gracefully.
            const substanceClass = this.substanceClasses.getById(substanceClassId);
            if (!substanceClass) {
                // Display helpful error in console for easier debugging
                log(
                    'AntibioticsFetcher: Substance class for %o not found within %o.',
                    antibioticData.substance[0],
                    this.substanceClasses.getAsArray(),
                );
                this.handleError({
                    severity: notificationSeverityLevels.warning,
                    message: `AntibioticsFetcher: Substance class with ID ${substanceClassId} not found for antibiotic ${JSON.stringify(antibioticData)}. Will not be displayed.`,
                });
                return;
            }

            const antibiotic = new Antibiotic(
                antibioticData.id,
                antibioticData.name,
                substanceClass,
                {
                    iv: antibioticData.intravenous,
                    po: antibioticData.perOs,
                    identifier: antibioticData.identifier,
                },
            );

            this.store.add(antibiotic);

        });

    }

}
