import { observable, action, runInAction } from 'mobx';
import storeStatus from './storeStatus.js';

/**
 * Scaffold of a store; contains only the most relevant shared functions:
 * - status
 * Is extended by store (that provides an abstraction for stores with multiple items of the same
 * kind), RDACounterStore and TenantStore (that contain non-list-like data)
 */
export default class BaseStore {

    // Use object so that we can add properties, e.g. an errorReason
    @observable status = {
        identifier: storeStatus.initialized,
    };

    /**
    * Add promise that fetches the store's data. Needed e.g. for resistances to observe status
    * of antibiotics/bacteria and resolve when (and not before) they are ready.
    */
    @action setFetchPromise(promise) {

        if (!(promise instanceof Promise)) {
            throw new Error(`Store: Argument passed to setFetchPromise must be a Promise, is ${promise} instead.`);
        }

        this.status.identifier = storeStatus.loading;

        promise.then(() => {
            runInAction(() => { this.status.identifier = storeStatus.ready; });
        }, (error) => {
            runInAction(() => {
                this.status = {
                    identifier: storeStatus.error,
                    error,
                };
            });
        });
    }

}
