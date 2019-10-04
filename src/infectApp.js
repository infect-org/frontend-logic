/**
* The main application that sets everything up and brings it together
*/
import 'whatwg-fetch';
import { when, observable, transaction } from 'mobx';
import debug from 'debug';
import AntibioticsStore from './models/antibiotics/antibioticsStore.js';
import AntibioticsFetcher from './models/antibiotics/antibioticsFetcher.js';
import SubstanceClassesStore from './models/antibiotics/substanceClassesStore.js';
import SubstanceClassesFetcher from './models/antibiotics/substanceClassesFetcher.js';
import BacteriaStore from './models/bacteria/bacteriaStore.js';
import BacteriaFetcher from './models/bacteria/bacteriaFetcher.js';
import ResistancesStore from './models/resistances/resistancesStore.js';
import ResistancesFetcher from './models/resistances/resistancesFetcher.js';
import MatrixView from './models/matrix/matrixView.js';
import DrawerViewModel from './models/drawer/DrawerViewModel.js';
import getFilterConfig from './models/filters/getFilterConfig.js';
import PropertyMap from './models/propertyMap/propertyMap.js';
import OffsetFilters from './models/filters/offsetFilters.js';
import SelectedFilters from './models/filters/selectedFilters.js';
import MostUsedFilters from './models/filters/mostUsedFilters.js';
import PopulationFilterUpdater from './models/populationFilter/populationFilterUpdater.js';
import PopulationFilterFetcher from './models/populationFilter/populationFilterFetcher.js';
import ErrorHandler from './models/errorHandler/errorHandler.js';
import updateDrawerFromGuidelines from './models/drawer/updateDrawerFromGuidelines.js';
import setupGuidelines from './models/guidelines/setupGuidelines.js';
import GuidelineStore from './models/guidelines/GuidelineStore.js';

const log = debug('infect:App');

export default class InfectApp {

    @observable views = {
        matrix: new MatrixView(),
        drawer: new DrawerViewModel(),
    };


    bacteria = new BacteriaStore();
    antibiotics = new AntibioticsStore();
    guidelines = new GuidelineStore();
    substanceClasses = new SubstanceClassesStore();
    resistances = new ResistancesStore([], item => `${item.bacterium.id}/${item.antibiotic.id}`);
    filterValues = new PropertyMap();

    // Filters for bacteria, antibiotics etc.
    selectedFilters = new SelectedFilters();
    // Filters for sampleSize and resistance, bound to a range input
    offsetFilters = new OffsetFilters();
    mostUsedFilters = new MostUsedFilters(this.selectedFilters, this.filterValues);

    errorHandler = new ErrorHandler();


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

        updateDrawerFromGuidelines(this.guidelines, this.views.drawer, this.errorHandler);

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
        return Promise
            .all([fetcherPromise, populationFilterPromise])
            // Catch and display error; if we don't, app will fail half-way because we're async.
            .catch(err => this.errorHandler.handle(err));
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
            this.errorHandler.handle.bind(this.errorHandler),
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
            this.errorHandler.handle.bind(this.errorHandler),
        );
        // Gets data for default filter switzerland-all
        const resistancePromise = resistanceFetcher.getData();
        log('Fetching data for resistances.');


        // Guidelines are important – but not crucial for INFECT to work. Handle errors nicely.
        // TODO: Make sure we are informed when they fail!
        const guidelinePromise = setupGuidelines(
            this._config,
            this.guidelines,
            this.bacteria,
            this.antibiotics,
            this.errorHandler.handle.bind(this.errorHandler),
        ).catch((err) => {
            const humanReadableError = new Error(`Guidelines could not be fetched from server, but INFECT will work without them. Please contact us if the issue persists. Original error:  ${err.message}`);
            this.errorHandler.handle(humanReadableError);
        });


        new PopulationFilterUpdater(
            resistanceFetcher,
            this.selectedFilters,
        );


        log('Fetchers setup done.');

        return Promise.all([
            substanceClassesPromise,
            antibioticPromise,
            bacteriaPromise,
            resistancePromise,
            guidelinePromise,
        ]);

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

