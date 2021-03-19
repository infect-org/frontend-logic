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


    /**
     * Gets filtered data for a set of filters
     * @param {object.<string, *[]>} filters   Filters; key is the filterName, values is an array
     *                                         of selected filters for the filterName
     * @return {Promise}
     */
    async getDataForFilters(filters) {
        // Store original URL
        if (!this.baseUrl) this.baseUrl = this.url;
        this.url = `${this.baseUrl}?filter=${JSON.stringify(filters)}`;
        await this.getData();
        log('Data for filters gotten');
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

        // TODO VET 2020: Remove the block
        // Just adds some test data to see if things might work. ONLY use for frontend testing,
        // not for unit/integration tests!

        const bacteria = Array.from(this.stores.bacteria.get().values());
        const antibiotics = Array.from(this.stores.antibiotics.get().values());
        const micData = {
            compoundSubstanceId: antibiotics.find(item => item.name === 'Penicillin G').id,
            microorganismId: bacteria.find(item => item.name === 'Achromobacter spp.').id,
            resistanceMICCount: 4321,
        };
        data.values.push(micData);
        const discDiffusionData = {
            compoundSubstanceId: antibiotics.find(item => item.name === 'Penicillin V').id,
            microorganismId: bacteria.find(item => item.name === 'Achromobacter spp.').id,
            resistanceDiscDiffusionCount: 1234,
        };
        data.values.push(discDiffusionData);

        const first = data.values.find(item => (
            item.compoundSubstanceId === 1 && item.microorganismId === 1
        ));
        first.resistanceDiscDiffusionCount = 231;
        first.resistanceMICCount = 2131;

        // END TODO



        // Values missing: There's nothing we could add
        if (!data.values || !data.values.length) {
            log('Values missing for %o', data);
            return;
        }



        // TODO: REMOVE for VET 2020
        // FUCKING HELL: We have to rewrite modelCount to resistanceQualitativeCount
        data.values.forEach((value) => {
            if (value.modelCount) {
                value.resistanceQualitativeCount = value.modelCount;
                delete value.modelCount;
            }
        });
        // END TODO



        let counter = 0;
        data.values.forEach((resistanceData) => {
            counter++;

            const resistance = this.createResistance(resistanceData);
            // If handler fails, do not add failed data to store
            if (!resistance) return;
            this.store.add(resistance);

        });


        log(`Added ${counter} resistances.`);
    }


    /**
     * Handles a qualitative resistance (with a percent based susceptibility that was calculated
     * based on breakpoints. Quantitiative resistances do not have known breakpoints.
     * @param {object} resistance       Resistance from server
     */
    createResistance(resistance) {

        const bacteria = Array.from(this.stores.bacteria.get().values());
        const antibiotics = Array.from(this.stores.antibiotics.get().values());

        const bacterium = bacteria.find(item => item.id === resistance.microorganismId);
        const antibiotic = antibiotics.find(item => item.id === resistance.compoundSubstanceId);

        // Missing bacterium or antibiotic is not crucial; display error but continue
        if (!antibiotic) {
            this.handleError({
                severity: notificationSeverityLevels.warning,
                message: `ResistancesFetcher: Antibiotic with ID ${resistance.compoundSubstanceId} missing, resistance ${JSON.stringify(resistance)} cannot be displayed.`,
            });
            console.error('Antibiotic for resistance %o missing; antibiotics are %o', resistance, antibiotics);
            return;
        }

        if (!bacterium) {
            this.handleError({
                severity: notificationSeverityLevels.warning,
                message: `ResistancesFetcher: Bacterium with ID ${resistance.microorganismId} missing, resistance ${JSON.stringify(resistance)} cannot be displayed.`,
            });
            console.error('Bacterium for resistance %o missing; bacteria are %o', resistance, bacteria);
            return;
        }

        const resistanceValues = this.createResistanceValues(resistance);

        // Creating a Resistance may fail if e.g. values are not valid; make sure we handle
        // errors gracefully but ignore the current resistance.
        let resistanceObject;
        try {
            resistanceObject = new Resistance(resistanceValues, antibiotic, bacterium);
        } catch (err) {
            this.handleError({
                severity: notificationSeverityLevels.warning,
                message: `Resistance for ${antibiotic.name} and ${bacterium.name} cannot be displayed: ${err.message}.`,
            });
            return;
        }

        // Duplicate resistance
        if (this.store.hasWithId(resistanceObject)) {
            console.warn(`ResistanceFetcher: Resistance ${JSON.stringify(resistance)} is a duplicate; an entry for the same bacterium and antibiotic does exist.`);
            return;
        }

        return resistanceObject;

    }


    createResistanceValues(resistanceData) {

        const values = [];

        if (resistanceData.resistanceQualitativeCount) {
            values.push({
                type: 'qualitative',
                value: resistanceData.resistantPercent / 100,
                sampleSize: resistanceData.resistanceQualitativeCount,
                confidenceInterval: [
                    resistanceData.confidenceInterval.lowerBound / 100,
                    resistanceData.confidenceInterval.upperBound / 100,
                ],
                data: {
                    resistant: resistanceData.resistant,
                    susceptible: resistanceData.susceptible,
                    intermediate: resistanceData.intermediate,
                },
            });
        }
        if (resistanceData.resistanceMICCount) {
            values.push({
                type: 'mic',
                sampleSize: resistanceData.resistanceMICCount,
            });
        }
        if (resistanceData.resistanceDiscDiffusionCount) {
            values.push({
                type: 'discDiffusion',
                sampleSize: resistanceData.resistanceDiscDiffusionCount,
            });
        }

        return values;
    }

}

