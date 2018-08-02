/**
* The main application that sets everything up and brings it together
*/
import 'whatwg-fetch';
import { when, observable } from 'mobx';
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
import errorHandler from './models/errorHandler/errorHandler';

const log = debug('infect:App');

export default class InfectApp {

    @observable views = {
        matrix: new MatrixView(),
    };


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

        this.bacteria = new BacteriaStore();
        this.antibiotics = new AntibioticsStore();
        this.substanceClasses = new SubstanceClassesStore();
        this.resistances = new ResistancesStore([], item => `${item.bacterium.id}/${
            item.antibiotic.id}`);

        this.filterValues = new PropertyMap();
        this._setupFilterValues();
        // Filters for bacteria, antibiotics etc.
        this.selectedFilters = new SelectedFilters();
        // Filters for sampleSize and resistance, bound to a range input
        this.offsetFilters = new OffsetFilters();
        this._setupOffsetFilters();

        this.mostUsedFilters = new MostUsedFilters(this.selectedFilters, this.filterValues);

        this._setupFetchers();

        this.views.matrix.setSelectedFilters(this.selectedFilters);
        this.views.matrix.setOffsetFilters(this.offsetFilters);
        this.views.matrix.setupDataWatchers(this.antibiotics, this.bacteria, this.resistances);

        const populationFilterFetcher = new PopulationFilterFetcher(
            this._config,
            this.filterValues,
        );
        populationFilterFetcher.init();

        this.errorHandler = errorHandler;

    }



    /**
    * Fetches data from the server, sets up data in the correct order and puts them into the
    * corresponding stores.
    */
    _setupFetchers() {

        // Substance classes (must be loaded first)
        const substanceClassesFetcher = new SubstanceClassesFetcher(
            this._config.endpoints.apiPrefix + this._config.endpoints.substanceClasses,
            this.substanceClasses,
        );
        substanceClassesFetcher.getData();
        log('Fetching data for substanceClasses.');

        // Antibiotics (wait for substance classes)
        const antibioticsFetcher = new AntibioticsFetcher(
            this._config.endpoints.apiPrefix + this._config.endpoints.antibiotics,
            this.antibiotics,
            { headers: { select: 'substance.*, substance.substanceClass.*' } },
            [this.substanceClasses],
            this.substanceClasses,
        );
        antibioticsFetcher.getData();
        log('Fetching data for antibiotics.');

        // Bacteria
        const bacteriaFetcher = new BacteriaFetcher(
            this._config.endpoints.apiPrefix + this._config.endpoints.bacteria,
            this.bacteria,
            { headers: { select: 'shape.*' } },
        );
        bacteriaFetcher.getData();
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
        resistanceFetcher.getData();

        const populationFilterUpdater = new PopulationFilterUpdater(
            resistanceFetcher,
            this.selectedFilters,
        );

        log('Fetching data for resistances.');
        log('Fetchers setup done.');

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
        entityConfigs.forEach((entityConfig) => {
            this[entityConfig.plural].getAsArray().forEach((item) => {

                // Don't add substanceClasses that are not linked to antibiotics
                if (entityConfig.singular === 'substanceClass' && !item.used) return;

                counter += 1;
                this.filterValues.addEntity(entityConfig.singular, item);
            });
        });
        log('All relevant entities ready, added %d entities to filters.', counter);
    }

}

