import { fetchApi } from './api';
import { observe } from 'mobx';
import debug from 'debug';
const log = debug('infect:StandardFetcher');

export default class StandardFetcher {

    /**
    * @param {String} url
    * @param {Store} store                  Store to which we save the data once it's loaded
    * @param {Object} options               Options for the fetch request (see fetch docs)
    * @param {Array} dependentStores        Stores that's status must be ready before data of this
    *                                       store is handled; antibiotics must wait for
    *                                       substanceClasses, resistances for antibiotics and
    *                                       bacteria.
    */
    constructor(url, store, options = {}, dependentStores = []) {
        if (!url || !store) throw new Error(`StandardFetcher: Arguments 'url' or 'store' missing.`);
        this._url = url;
        this._store = store;
        this._options = options;
        this._dependentStores = dependentStores;
    }


    /**
    * Main method: Fetches the data, stores in in the store.
    */
    async getData() {
        log('Get data for %s, options are %o', this._url, this._options);
        // Create a new promise to pass to the store – it must only be resolved **after**
        // data was handled and rejected if status !== 200.
        let resolver;
        let rejector;
        const promise = new Promise((resolve, reject) => {
            resolver = resolve;
            rejector = reject;
        });
        this._store.setFetchPromise(promise);

        // Add timestamp to prevent caching as file names don't change
        const defaultOptions = {
            cache: 'no-store',
            // Requests at Insel (Edge) are rejected with status 407. This might help:
            credentials: 'include',
        };
        const options = { ...defaultOptions, ...this._options };
        log('Options are %o', options);

        let result;
        try {
            result = await fetchApi(this._url, options);
            log('Got back data %o', result);
        } catch (err) {
            // Fetch failed: reject promise on store
            rejector(err);
            throw err;
        }

        // Invalid HTTP Status
        if (result.status !== 200) {
            const err = new Error(`StandardFetcher: Status ${result.status} is invalid.`);
            rejector(err);
            throw err;
        }

        // Wait until all fetchPromises of dependentStores are resolved
        await this._awaitDependentStores();
        this._handleData(result.data);

        // Resolve promise in store
        log('Resolve fetch promise, added %d items to store', this._store.get().size);
        resolver();
    }


    /**
    * Waits until all dependent stores are 'ready'.
    */
    async _awaitDependentStores() {

        const loadingStores = this._dependentStores.filter((store) => {
            return store.status.identifier === 'loading';
        });
        if (!loadingStores.length) return Promise.resolve();

        // Convert observers to promises; this method resolves when all promises are done
        await Promise.all(loadingStores.map((store) => {
            return new Promise((resolve) => {
                observe(store.status, (status) => {
                    if (status.newValue === 'ready') resolve();
                });
            });
        }));
    }


    /**
    * Default data handler, should be overwritten in derived classes.
    */
    _handleData(data) {
        console.warn('StandardFetcher: _handleData method not implemented in derived class.');
        if (!data) return;
        data.forEach((item) => {
            this._store.add(item);
        });
    }

}

