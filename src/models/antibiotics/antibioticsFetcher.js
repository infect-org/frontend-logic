import Fetcher from '../../helpers/standardFetcher';
import Antibiotic from './antibiotic';

export default class AntibioticsFetcher extends Fetcher {

    constructor(...args) {
        super(...args.slice(0, 4));
        this.substanceClasses = args[4];
        this.handleError = args[5];
    }

    _handleData(data) {

        // Cone data as we're modifying it
        data.forEach((item) => {

            // There are 2 special cases: amoxicillin/clavulanate and piperacillin/tazobactam
            // get a «virtual» substance class Beta-lactam + inhibitor that was programmatically
            // created in SubstanceClassFetcher
            if (
                item.identifier === 'amoxicillin/clavulanate' ||
                item.identifier === 'piperacillin/tazobactam'
            ) {
                item.substance = [{
                    substanceClass: {
                        id: -1,
                    },
                }];
            }

            if (!item.substance.length) {
                const err = new Error(`antibioticsFetcher: Compound ${JSON.stringify(item)} has no substance data. Cannot be displayed.`);
                this.handleError(err);
                return;
            }

            // More than one substance. Just display error (as we won't use substances with
            // index > 0), but add antibiotic.
            if (item.substance.length > 1) {
                const err = new Error(`antibioticsFetcher: Compound ${JSON.stringify(item)} has more than one substance; this is not expected.`);
                this.handleError(err);
            }

            // substance hasOne substanceClass – no need to validate data. But check if
            // substanceClass exists on API data. Handle gracefully.
            if (!item.substance[0].substanceClass) {
                const err = new Error(`antibioticsFetcher: Substance ${JSON.stringify(item.substance[0])} has invalid substanceClass data.`);
                this.handleError(err);
                return;
            }
            const substanceClassId = item.substance[0].substanceClass.id;

            // Substance class does not exist: Handle gracefully.
            const substanceClass = this.substanceClasses.getById(substanceClassId);
            if (!substanceClass) {
                const err = new Error(`AntibioticsFetcher: Substance class with ID ${substanceClassId} not found.`);
                // Display helpful error in console for easier debugging
                console.error(
                    'AntibioticsFetcher: Substance class for %o not found within %o.',
                    item.substance[0],
                    this.substanceClasses.getAsArray(),
                );
                this.handleError(err);
                return;
            }

            const antibiotic = new Antibiotic(item.id, item.name, substanceClass, {
                iv: item.intravenous,
                po: item.perOs,
                identifier: item.identifier,
            });

            this._store.add(antibiotic);
        });
    }

}
