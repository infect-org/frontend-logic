import { transaction } from 'mobx';
import debug from 'debug';
import Fetcher from '../../helpers/standardFetcher.js';
import Resistance from './resistance.js';
import notificationSeverityLevels from '../notifications/notificationSeverityLevels.js';

const log = debug('infect:ResistancesFetcher');

export default class ResistancesFetcher extends Fetcher {

    /**
     * Counts up every time handleData is called. Needed as we remove all antibiotics and bacteria
     * that do not contain resistance data on the *first* call.
     * @type {Number}
     */
    dataHandled = 0;

    /**
    * Fetches resistances from server, then updates ResistancesStore passed as an argument.
    *
    * @param {object} options
    * @param {array} options.dependentStores    AntibioticStore and BacteriaStore
    * @param {function} options.handleError     Error handling function
    */
    constructor(options) {
        super(options);
        const { handleError, dependentStores } = options;
        const [antibiotics, bacteria] = dependentStores;
        this.stores = { antibiotics, bacteria };
        this.handleError = handleError;
    }


    async getData(...params) {
        /**
         *  Set URL of latest call; in this.handleData(), drop all data that does not belong to
         *  latest call (as earlier calls might be answered later and data for the wrong filters
         *  would be displayed
         */
        this.latestCallURL = this.url;
        await super.getData(...params);
    }

    async getDataForFilters(filters) {
        // Store original URL
        if (!this.baseUrl) this.baseUrl = this.url;
        this.url = `${this.baseUrl}?filter=${JSON.stringify(filters)}`;
        await this.getData();
    }


    /**
    * Sets up ResistancesStore with data fetched from server.
    * @param {Array} data       Data as gotten from server
    */
    handleData(data, url) {

        log('Handle data %o', data);
        this.dataHandled += 1;

        if (url !== this.latestCallURL) {
            log('Data belongs to URL %s, latest URL is %s; drop data.', url, this.latestCallURL);
            return;
        }

        this.store.clear();

        const bacteria = Array.from(this.stores.bacteria.get().values());
        const antibiotics = Array.from(this.stores.antibiotics.get().values());


        // Values missing: There's nothing we could add
        if (!data.values || !data.values.length) {
            log('Values missing for %o', data);
            return;
        }

        let counter = 0;
        data.values.forEach((resistance) => {

            const bacterium = bacteria.find(item => item.id === resistance.bacteriumId);
            const antibiotic = antibiotics.find(item => item.id === resistance.compoundId);

            // Missing bacterium or antibiotic is not crucial; display error but continue
            if (!antibiotic) {
                this.handleError({
                    severity: notificationSeverityLevels.warning,
                    message: `ResistancesFetcher: Antibiotic with ID ${resistance.compoundId} missing, resistance ${JSON.stringify(resistance)} cannot be displayed.`,
                });
                console.error('Antibiotic for resistance %o missing; antibiotics are %o', resistance, antibiotics);
                return;
            }

            if (!bacterium) {
                this.handleError({
                    severity: notificationSeverityLevels.warning,
                    message: `ResistancesFetcher: Bacterium with ID ${resistance.bacteriumId} missing, resistance ${JSON.stringify(resistance)} cannot be displayed.`,
                });
                console.error('Bacterium for resistance %o missing; bacteria are %o', resistance, bacteria);
                return;
            }

            const resistanceValues = [{
                type: 'import',
                value: resistance.resistantPercent / 100,
                sampleSize: resistance.modelCount || 0,
                confidenceInterval: [
                    resistance.confidenceInterval.lowerBound / 100,
                    resistance.confidenceInterval.upperBound / 100,
                ],
            }];
            const resistanceObject = new Resistance(resistanceValues, antibiotic, bacterium);

            // Duplicate resistance
            if (this.store.hasWithId(resistanceObject)) {
                console.warn(`ResistanceFetcher: Resistance ${JSON.stringify(resistance)} is
                    a duplicate; an entry for the same bacterium and antibiotic does exist.`);
                return;
            }

            this.store.add(resistanceObject);
            counter += 1;

        });

        log(`Added ${counter} resistances.`);
    }

}

