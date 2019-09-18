import { transaction } from 'mobx';
import debug from 'debug';
import Fetcher from '../../helpers/standardFetcher';
import Resistance from './resistance';

const log = debug('infect:ResistancesFetcher');

export default class ResistancesFetcher extends Fetcher {

    dataHandled = 0;

    /**
    * Fetches resistances from server, then updates ResistancesStore passed as an argument.
    *
    * @param [0-3]                              See Fetcher
    * @param {ResistanceStore} stores           Stores for antibiotics *and* bacteria
    * @param {Function} handleError             Function that gently handles non-critical exceptions
    */
    constructor(url, store, options, dependentStores, stores, handleError) {
        super(url, store, options, dependentStores);
        this._stores = stores;
        this.handleError = handleError;
    }


    async getDataForFilters(filters) {
        // Store original URL
        if (!this._baseUrl) this._baseUrl = this._url;
        this._url = `${this._baseUrl}?filter=${JSON.stringify(filters)}`;
        await this.getData();
    }


    /**
    * Sets up ResistancesStore with data fetched from server.
    * @param {Array} data       Data as gotten from server
    */
    _handleData(data) {

        log('Handle data %o', data);
        this.dataHandled += 1;

        this._store.clear();

        const bacteria = Array.from(this._stores.bacteria.get().values());
        const antibiotics = Array.from(this._stores.antibiotics.get().values());

        // On the very first round (when we're getting data for switzerland-all) remove all
        // antibiotics that don't have any resistance data.
        // TODO: We need a good endpoint which only returns ab/bact with data available.
        if (this.dataHandled === 1) {

            const emptyBacteria = bacteria
                // Get all bacteria that don't have any resistance data
                .filter(bacterium => !data.values.find(res => res.bacteriumId === bacterium.id));

            if (emptyBacteria.length) {
                log('Remove empty bacteria %o', emptyBacteria);
            }

            // Remove bacterium from store which triggers removal from matrixView – do it in
            // 1 step to save resources. TODO: update the whole logic and don't create Bacteria
            // for unused bacteria data
            transaction(() => {
                emptyBacteria.forEach((emptyBacterium) => {
                    this._stores.bacteria.remove(emptyBacterium);
                });
            });
        }

        // Values missing: There's nothing we could add
        if (!data.values || !data.values.length) {
            log('Values missing');
            return;
        }

        let counter = 0;
        data.values.forEach((resistance) => {

            // Some resistances don't contain compound data. Slack, 2018-04-05:
            // fxstr [4:38 PM]
            // es hat einige resistances ohne id_compound. wie soll ich die handeln? ignorieren?
            // ee [4:38 PM]
            // iu
            // müssen wir dann noch anschauen
            if (!Object.prototype.hasOwnProperty.call(resistance, 'compoundId')) {
                console.error(`ResistanceFetcher: Resistance ${JSON.stringify(resistance)} does not have compound information; ignore for now, but should be fixed.`);
                return;
            }

            const bacterium = bacteria.find(item => item.id === resistance.bacteriumId);
            const antibiotic = antibiotics.find(item => item.id === resistance.compoundId);

            // Missing bacterium or antibiotic is not crucial; display error but continue
            if (!antibiotic) {
                const antibioticMissingError = new Error(`ResistancesFetcher: Antibiotic with ID ${resistance.compoundId} missing, resistance ${JSON.stringify(resistance)} cannot be displayed.`);
                this.handleError(antibioticMissingError);
                console.error('Antibiotic for resistance %o missi/ng; antibiotics are %o', resistance, antibiotics);
                return;
            }

            if (!bacterium) {
                const bacteriumMissingError = new Error(`ResistancesFetcher: Bacterium with ID ${resistance.bacteriumId} missing, resistance ${JSON.stringify(resistance)} cannot be displayed.`);
                this.handleError(bacteriumMissingError);
                console.error('Bacterium for resistance %o missing; bacteria are %o', resistance, bacteria);
                return;
            }

            const resistanceValues = [{
                type: 'import',
                value: resistance.resistantPercent / 100,
                sampleSize: resistance.sampleCount || 0,
                confidenceInterval: [
                    resistance.confidenceInterval.lowerBound / 100,
                    resistance.confidenceInterval.upperBound / 100,
                ],
            }];
            const resistanceObject = new Resistance(resistanceValues, antibiotic, bacterium);

            // Duplicate resistance
            if (this._store.hasWithId(resistanceObject)) {
                console.warn(`ResistanceFetcher: Resistance ${JSON.stringify(resistance)} is a duplicate; an entry for the same bacterium and antibiotic does exist.`);
                return;
            }

            this._store.add(resistanceObject);
            counter += 1;

        });

        log(`Added ${counter} resistances.`);
    }

}

