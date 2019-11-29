import { observe } from 'mobx';
import debug from 'debug';
import { fetchApi } from './api.js';
import storeStatus from './storeStatus.js';

const log = debug('infect:StandardFetcher');

export default class StandardFetcher {

    /**
    * @param {object} options
    * @param {string} options.url
    * @param {Store} options.store          Store to which we save the data once it's loaded
    * @param {object} options.options       Options for the fetch request (see fetch docs)
    * @param {Store[]} options.dependentStores   Stores that's status must be ready before data of
    *                                       this store is handled. Example: Antibiotics must wait
    *                                       for substanceClasses, resistances for antibiotics and
    *                                       bacteria.
    *                                       Pass a Store (and not the Fetcher) here as we might
    *                                       want to access the store's data when it's ready – e.g.
    *                                       to create links from a resistance to the corresponding
    *                                       bacterium and antibiotic. As the store is a property of
    *                                       this class, we can access it in this.handleData().
    */
    constructor({
        url,
        store,
        options = {},
        dependentStores = [],
    } = {}) {
        if (!url || !store) {
            throw new Error(`StandardFetcher: Arguments 'url' (${url}) or 'store' ${store} missing .`);
        }
        this.url = url;
        this.store = store;
        this.options = options;
        this.dependentStores = dependentStores;
    }


    /**
    * Main method: Fetches data from this.url, awaits this.dependentStores, then calls
    * this.handleData() with the data fetched.
    * @return {Promise}     Returns a promise that resolves to the raw data fetched from server
    */
    async getData() {
        /**
         * We use url as an identifier for the call we made; it's passed along the function chain
         * and needed in handleData to see what call (i.e. url) the data belongs to. This helps us
         * prevent race conditions (we can check if data belongs to the latest call that was made
         * and ignore it otherwise)
         * We could use AbortController to cancel old/earlier requests; but it is not compatible
         * with IE11 (https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)
         */
        const dataPromise = this.getAndParseData(this.url);
        this.store.setFetchPromise(dataPromise);
        return dataPromise;
    }


    /**
     * Does the actual fetching and parsing; is needed as this.getData() needs a promise to store
     * the fetch promise in this.store.
     * @param {String} url  URL to fetch
     * @return {Promise}    Promise that is resolved after data was handled by this.handleData (or
     *                      rejected in case of failure)
     * @private
     */
    async getAndParseData(url) {

        log('Get data for %s, options are %o', url, this.options);

        const defaultOptions = {
            cache: 'no-store',
            // Requests at Insel (Edge) are rejected with status 407. This might help:
            credentials: 'include',
        };
        const options = { ...defaultOptions, ...this.options };
        log('Options are %o', options);

        const result = await fetchApi(url, options);
        log('Got back data %o', result);

        // Invalid HTTP Status
        if (result.status !== 200) {
            throw new Error(`StandardFetcher: Status ${result.status} is invalid.`);
        }

        // Wait until all fetchPromises of dependentStores are resolved
        await this.awaitDependentStores();

        /**
         * Pass data and URL of the call to handleData; URL is needed to check what call data
         * belongs to.
         */
        this.handleData(result.data, url);

        // Resolve promise in store
        log('Data handled, store is %o', this.store);

        // As getData() returns the promise created by this method, we return the data so that
        // getData() resolves to the data passed in
        return result.data;

    }


    /**
    * Waits until all dependent stores are 'ready'.
    * @private
    */
    async awaitDependentStores() {

        const loadingStores = this.dependentStores
            .filter(store => (
                store.status.identifier === (storeStatus.loading ||
                    store.status.identifier === storeStatus.initialized)
            ));
        log('Waiting for %d stores', loadingStores.length);

        // Convert observers to promises; this method resolves when all promises are done
        await Promise.all(loadingStores.map(store => (
            new Promise((resolve) => {
                observe(store.status, (status) => {
                    if (status.newValue === storeStatus.ready) resolve();
                });
            })
        )));
    }


    /**
    * Default data handler, should be overwritten in derived classes. Handles/transforms data and
    * usually adds it to the store.
    * Two parameters are available: data (raw data fetched from server) and url (URL that data
    * was fetched from)
    * @private
    */
    handleData(data) {
        data.forEach((item) => {
            this.store.add(item);
        });
    }

}

