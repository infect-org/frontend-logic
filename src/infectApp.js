/**
* The main application that sets everything up and brings it together
*/
import 'whatwg-fetch';
import { when, observable, transaction } from 'mobx';
import debug from 'debug';
import AntibioticsStore from './models/antibiotics/antibioticsStore';
import AntibioticsFetcher from './models/antibiotics/antibioticsFetcher';
import SubstanceClassesStore from './models/antibiotics/substanceClassesStore';
import SubstanceClassesFetcher from './models/antibiotics/substanceClassesFetcher';
import BacteriaStore from './models/bacteria/bacteriaStore';
import BacteriaFetcher from './models/bacteria/bacteriaFetcher';
import ResistancesStore from './models/resistances/resistancesStore';
import ResistancesFetcher from './models/resistances/resistancesFetcher';
import MatrixView from './models/matrix/matrixView';
import getFilterConfig from './models/filters/getFilterConfig';
import PropertyMap from './models/propertyMap/propertyMap';
import OffsetFilters from './models/filters/offsetFilters';
import SelectedFilters from './models/filters/selectedFilters';
import MostUsedFilters from './models/filters/mostUsedFilters';
import PopulationFilterUpdater from './models/populationFilter/populationFilterUpdater';
import PopulationFilterFetcher from './models/populationFilter/populationFilterFetcher';
import GuidelineFetcher from './models/guidelines/GuidelineFetcher';
import GuidelineStore from './models/guidelines/GuidelineStore';
import errorHandler from './models/errorHandler/errorHandler';

const log = debug('infect:App');

export default class InfectApp {

    @observable views = {
        matrix: new MatrixView(),
    };


    bacteria = new BacteriaStore();
    antibiotics = new AntibioticsStore();
    substanceClasses = new SubstanceClassesStore();
    guidelines = new GuidelineStore();
    resistances = new ResistancesStore([], item => `${item.bacterium.id}/${item.antibiotic.id}`);
    filterValues = new PropertyMap();

    // Filters for bacteria, antibiotics etc.
    selectedFilters = new SelectedFilters();
    // Filters for sampleSize and resistance, bound to a range input
    offsetFilters = new OffsetFilters();
    mostUsedFilters = new MostUsedFilters(this.selectedFilters, this.filterValues);

    errorHandler = errorHandler;


    /**
    * @param {Object} config        e.g. {
    *                                   endpoints: {
    *                                       apiPrefix: '/'
    *                                       bacteria: 'bacterium'
    *                                       antibiotics: 'antibiotic'
    *                                       resistances: 'resistance'
    *                                   }
    *                               }
    */
    constructor(config) {

        this._config = config;

        this._setupFilterValues();
        this._setupOffsetFilters();

        this.views.matrix.setSelectedFilters(this.selectedFilters);
        this.views.matrix.setOffsetFilters(this.offsetFilters);
        this.views.matrix.setupDataWatchers(this.antibiotics, this.bacteria, this.resistances);

    }


    /**
     * Use separate init method as it uses async functions; we shall not use those in a
     * constructor.
     */
    initialize() {
        const fetcherPromise = this._setupFetchers();
        const populationFilterFetcher = new PopulationFilterFetcher(
            this._config,
            this.filterValues,
        );
        const populationFilterPromise = populationFilterFetcher.init();
        return Promise.all([fetcherPromise, populationFilterPromise]);
    }


    /**
    * Fetches data from the server, sets up data in the correct order and puts them into the
    * corresponding stores.
    * @returns {Promise}
    */
    _setupFetchers() {

        // Substance classes (must be loaded first)
        const substanceClassesFetcher = new SubstanceClassesFetcher(
            this._config.endpoints.apiPrefix + this._config.endpoints.substanceClasses,
            this.substanceClasses,
        );
        const substanceClassesPromise = substanceClassesFetcher.getData();

        log('Fetching data for substanceClasses.');

        // Antibiotics (wait for substance classes)
        const antibioticsFetcher = new AntibioticsFetcher(
            this._config.endpoints.apiPrefix + this._config.endpoints.antibiotics,
            this.antibiotics,
            { headers: { select: 'substance.*, substance.substanceClass.*' } },
            [this.substanceClasses],
            this.substanceClasses,
        );
        const antibioticPromise = antibioticsFetcher.getData();
        log('Fetching data for antibiotics.');

        // Bacteria
        const bacteriaFetcher = new BacteriaFetcher(
            this._config.endpoints.apiPrefix + this._config.endpoints.bacteria,
            this.bacteria,
            { headers: { select: 'shape.*' } },
        );
        const bacteriaPromise = bacteriaFetcher.getData();
        log('Fetching data for bacteria.');

        // Resistances (wait for antibiotics and bacteria)
        const resistanceFetcher = new ResistancesFetcher(
            this._config.endpoints.apiPrefix + this._config.endpoints.resistances,
            this.resistances,
            {},
            [this.antibiotics, this.bacteria],
            {
                antibiotics: this.antibiotics,
                bacteria: this.bacteria,
            },
        );
        // Gets data for default filter switzerland-all
        const resistancePromise = resistanceFetcher.getData();

        /**
         * Fake-get guidelines; only fetch them after bacteria and antibiotics are ready as we need
         * to link those to our therapies.
         * TODO: Update when API is ready.
         */
        const guidelinePromise = Promise.all([bacteriaPromise, antibioticPromise]).then(() => {
            const guidelineFetcher = new GuidelineFetcher(
                this.guidelines,
                this.antibiotics,
                this.bacteria,
            );
            guidelineFetcher.getData();
        });

        new PopulationFilterUpdater(
            resistanceFetcher,
            this.selectedFilters,
        );

        log('Fetching data for resistances.');
        log('Fetchers setup done.');

        return Promise.all([substanceClassesPromise, antibioticPromise, bacteriaPromise,
            resistancePromise, guidelinePromise]);

    }



    _setupOffsetFilters() {
        this.offsetFilters.setFilter('sampleSize', 'min', 20);
        this.offsetFilters.setFilter('susceptibility', 'min', 0);
    }



    /**
    * Confgiures filterValues for antibiotics, bacteria etc., then adds data for all entities
    * as soon as it becomes available (after data is fetched from server).
    */
    _setupFilterValues() {
        const filterConfig = getFilterConfig();
        filterConfig.forEach((config) => {
            this.filterValues.addConfiguration(config.entityType, config.config);
            log('FilterConfig %o set for %s', config.config, config.entityType);
        });

        const entities = [{
            singular: 'substanceClass',
            plural: 'substanceClasses',
        }, {
            singular: 'antibiotic',
            plural: 'antibiotics',
        }, {
            singular: 'bacterium',
            plural: 'bacteria',
        }];


        let entitiesReady = 0;
        entities.forEach((entityConfig) => {
            // Only add entities to filterValues when **all** entity types are ready to prevent
            // unndecessary re-renderings when filterValues change.
            when(() => this[entityConfig.plural].status.identifier === 'ready', () => {
                entitiesReady += 1;
                if (entitiesReady === entities.length) this._addAllEntitiesToFilters(entities);
                log('%d of %d entities ready.', entitiesReady, entities.length);
            });
        });

    }



    /**
    * Adds all entities (subsClasses, ab, bact) to filterValues once they are ready.
    * @param {Array} entityConfig           Object with singular and plural form for all entity
    *                                       types
    */
    _addAllEntitiesToFilters(entityConfigs) {
        let counter = 0;
        transaction(() => {
            entityConfigs.forEach((entityConfig) => {
                this[entityConfig.plural].getAsArray().forEach((item) => {

                    // Don't add substanceClasses that are not linked to antibiotics
                    if (entityConfig.singular === 'substanceClass' && !item.used) return;

                    counter += 1;
                    this.filterValues.addEntity(entityConfig.singular, item);
                });
            });
        });
        log('All relevant entities ready, added %d entities to filters.', counter);
    }

}

