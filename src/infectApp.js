/**
* The main application that sets everything up and brings it together
*/
import { when, observable, transaction, reaction } from 'mobx';
import debug from 'debug';
import storeStatus from './helpers/storeStatus.js';
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
import PopulationFilterUpdater from './models/populationFilter/PopulationFilterUpdater.js';
import setupAgeGroups from './models/populationFilter/setupAgeGroups.js';
import setupPopulationFilters from './models/populationFilter/setupPopulationFilters.js';
import NotificationCenter from './models/notifications/NotificationCenter.js';
import updateDrawerFromGuidelines from './models/drawer/updateDrawerFromGuidelines.js';
import setupGuidelines from './models/guidelines/setupGuidelines.js';
import GuidelineStore from './models/guidelines/GuidelineStore.js';
import RDACounterStore from './models/rdaCounter/RDACounterStore.js';
import RDACounterFetcher from './models/rdaCounter/RDACounterFetcher.js';
import TenantConfigFetcher from './models/tenantConfig/TenantConfigFetcher.js';
import TenantConfigStore from './models/tenantConfig/TenantConfigStore.js';
import notificationSeverityLevels from './models/notifications/notificationSeverityLevels.js';
import GuidelineSelectedFiltersBridge from
    './models/guidelineSelectedFiltersBridge/GuidelineSelectedFiltersBridge.js';
import Store from './helpers/Store.js';
import getQuantitativeDataForActiveResistance from './models/resistances/getQuantitativeDataForActiveResistance';
import getQuantitativeDataForDrawer from './models/resistances/getQuantitativeDataForDrawer.js';


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
    tenantConfig = new TenantConfigStore();

    // Filters for bacteria, antibiotics etc.
    selectedFilters = new SelectedFilters();
    // Filters for sampleSize and resistance, bound to a range input
    offsetFilters = new OffsetFilters();
    mostUsedFilters = new MostUsedFilters(this.selectedFilters, this.filterValues);

    notificationCenter = new NotificationCenter();

    // Age groups need to be stored so that we can retreive the from/to values when an
    // age group is selected
    ageGroupStore = new Store();


    // Counts amount of properties available on RDA (in unfiltered state for the current tenant)
    rdaCounterStore = new RDACounterStore(this.notificationCenter.handle
        .bind(this.notificationCenter));

    guidelineRelatedFilters = new GuidelineSelectedFiltersBridge(
        this.guidelines,
        this.selectedFilters,
        this.filterValues,
    );

    /**
    * @param {object} config
    * @param {function} config.getURL            Function that takes two arguments (scope and
    *                                            endpoint) and returns corresponding URL
    * @param {boolean} config.previewGuidelines  If true, preview data will be used for guidelines
    * @param {string[]} config.dataVersionStatusIdentifiers       Array with all identifiers that
    *                                            should be loaded from RDA, e.g.
    *                                            ['preview', 'active'].
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

        updateDrawerFromGuidelines(this.guidelines, this.views.drawer, this.notificationCenter);
        getQuantitativeDataForActiveResistance(this.views.matrix, this._config.getURL);
        getQuantitativeDataForDrawer(this.views.drawer, this._config.getURL);

        const fetcherPromise = this._setupFetchers();
        const populationFilterPromise = setupPopulationFilters(
            this._config.getURL,
            this.filterValues,
            this.rdaCounterStore,
        );

        const ageGroupFilterPromise = setupAgeGroups(
            this.tenantConfig,
            this.filterValues,
            this.ageGroupStore,
            this.notificationCenter.handle.bind(this.notificationCenter),
        );
        return Promise
            .all([fetcherPromise, populationFilterPromise, ageGroupFilterPromise])
            // Catch and display error; if we don't, app will fail half-way because we're async.
            .then(() => {
                log('INFECT app successfully initialized');
            }, (err) => {
                this.notificationCenter.handle(err);
            });
    }


    /**
    * Fetches data from the server, sets up data in the correct order and puts them into the
    * corresponding stores.
    * @returns {Promise}
    */
    _setupFetchers() {

        // Substance classes (must be loaded first)
        const substanceClassesFetcher = new SubstanceClassesFetcher({
            url: this._config.getURL('coreData', 'substanceClasses'),
            store: this.substanceClasses,
        });
        const substanceClassesPromise = substanceClassesFetcher.getData();

        log('Fetching data for substanceClasses.');

        // Antibiotics (wait for substance classes)
        const antibioticsFetcher = new AntibioticsFetcher({
            url: this._config.getURL('coreData', 'antibiotics'),
            store: this.antibiotics,
            options: { headers: { select: 'substance.*, substance.substanceClass.*' } },
            dependentStores: [this.substanceClasses, this.rdaCounterStore],
            handleError: this.notificationCenter.handle.bind(this.notificationCenter),
        });
        const antibioticPromise = antibioticsFetcher.getData();
        log('Fetching data for antibiotics.');

        // Bacteria
        const bacteriaFetcher = new BacteriaFetcher({
            url: this._config.getURL('coreData', 'bacteria'),
            store: this.bacteria,
            options: { headers: { select: 'shape.*' } },
            dependentStores: [this.rdaCounterStore],
        });
        const bacteriaPromise = bacteriaFetcher.getData();
        log('Fetching data for bacteria.');




        // Resistances (wait for antibiotics and bacteria)
        const resistanceFetcher = new ResistancesFetcher({
            url: this._config.getURL('rda', 'data'),
            store: this.resistances,
            dependentStores: [this.antibiotics, this.bacteria],
            handleError: this.notificationCenter.handle.bind(this.notificationCenter),
        });

        const updater = new PopulationFilterUpdater(
            resistanceFetcher,
            this.selectedFilters,
            this.ageGroupStore,
            this.notificationCenter.handle.bind(this.notificationCenter),
            this._config.dataVersionStatusIdentifiers,
        );
        updater.setup();

        // Pass filterHeaders as we might filter even before the user interacted with the user
        // interface (e.g. for preview data)
        const resistancePromise = resistanceFetcher.getDataForFilters(updater.filterHeaders);
        log('Fetching data for resistances.');




        // Guidelines are important – but not crucial for INFECT to work. Handle errors nicely.
        // TODO: Make sure we are informed when they fail!
        const guidelinePromise = setupGuidelines(
            this._config.getURL,
            this.guidelines,
            this.bacteria,
            this.antibiotics,
            this.notificationCenter.handle.bind(this.notificationCenter),
        ).catch((err) => {
            const humanReadableError = `Guidelines could not be fetched from server, but INFECT will work without them. Please contact us if the issue persists. Original error:  ${err.message}`;
            this.notificationCenter.handle({
                severity: notificationSeverityLevels.warning,
                message: humanReadableError,
            });
        });

        const tenantConfigFetcher = new TenantConfigFetcher({
            url: this._config.getURL('tenant', 'config'),
            store: this.tenantConfig,
            // Handle errors gracefully, as there should always be a fallback for all values/flags
            // in tenantConfig
            handleException: this.notificationCenter.handle.bind(this.notificationCenter),
        });
        const tenantConfigFetcherPromise = tenantConfigFetcher.getData();


        const rdaCounterFetcher = new RDACounterFetcher({
            url: this._config.getURL('rda', 'counter'),
            store: this.rdaCounterStore,
            handleError: this.notificationCenter.handle.bind(this.notificationCenter),
            dataVersionStatusIdentifiers: this._config.dataVersionStatusIdentifiers,
        });
        const rdaCounterFetcherPromise = rdaCounterFetcher.getData();


        log('Fetchers setup done.');


        return Promise.all([
            substanceClassesPromise,
            rdaCounterFetcherPromise,
            antibioticPromise,
            bacteriaPromise,
            resistancePromise,
            guidelinePromise,
            tenantConfigFetcherPromise,
        ]);

    }



    _setupOffsetFilters() {
        // Default offset filters to 20 (infect by anresis)
        this.offsetFilters.setFilter('sampleSize', 'min', 20);
        // Update sample size offset filter from tenantConfig when it is set
        reaction(
            () => {
                const frontendConfig = this.tenantConfig.getConfig('frontend');
                if (frontendConfig &&
                    frontendConfig.userInterface &&
                    typeof frontendConfig.userInterface.sampleCountDefaultValue === 'number'
                ) {
                    return frontendConfig.userInterface.sampleCountDefaultValue;
                }
                return undefined;
            },
            (sampleCountDefaultValue) => {
                this.offsetFilters.setFilter('sampleSize', 'min', sampleCountDefaultValue);
            },
        );
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
            when(() => this[entityConfig.plural].status.identifier === storeStatus.ready, () => {
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

