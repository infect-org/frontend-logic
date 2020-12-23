import { action, makeObservable, observable } from 'mobx';
import BaseStore from '../../helpers/BaseStore.js';

/**
 * Stores tenantConfig and provides method for easily and failsafely accessing its properties
 */
export default class TenantConfigStore extends BaseStore {

    featureFlags = new Map();
    config = new Map();

    constructor(...params) {
        super(...params);
        makeObservable({
            featureFlags: observable,
            config: observable,
            validateAndSetFeatureFlags: action,
            validateAndSetConfig: action,
        });
    }

    setData(data) {
        if (!data || typeof data !== 'object' || data === null || data.constructor !== Object) {
            throw new Error(`TenantConfigStore: Data passed in is invalid; expected object with properties configuration and/or featureFlags but got ${JSON.stringify(data)}`);
        }
        if (data.featureFlags) this.validateAndSetFeatureFlags(data);
        if (data.configuration) this.validateAndSetConfig(data);
    }

    /**
     * Validates and updates this.featureFlags
     * @param {object} data     Data from server. Needs a property featureFlags which is an array
     *                          of objects with properties identifier (string) and enabled (boolean)
     * @private
     */
    validateAndSetFeatureFlags(data) {
        if (!Array.isArray(data.featureFlags)) {
            throw new Error(`TenantConfigStore: Property futureFlags on tenantConfig must be an array, is ${JSON.stringify(data.featureFlags)}`);
        }
        for (const flag of data.featureFlags) {
            if (typeof flag.identifier !== 'string' || typeof flag.enabled !== 'boolean') {
                throw new Error(`TenantConfigStore: Expected properties identifier (string) and enabled(boolean) on featureFlag, but got ${JSON.stringify(flag)}`);
            } else {
                this.featureFlags.set(flag.identifier, flag.enabled);
            }
        }
    }

    /**
     * Validates and updates this.config
     * @param {object} data     Data from server. Needs a property configuration which is an array
     *                          of objects with properties identifier (string) and config (any)
     * @private
     */
    validateAndSetConfig(data) {
        if (!Array.isArray(data.configuration)) {
            throw new Error(`TenantConfigStore: Expected data.configuration to be an array, but is ${JSON.stringify(data.configuration)}`);
        }
        for (const config of data.configuration) {
            if (
                typeof config !== 'object' ||
                config === null ||
                config.constructor !== Object ||
                typeof config.identifier !== 'string' ||
                !Object.prototype.hasOwnProperty.call(config, 'config')
            ) {
                throw new Error(`TenantConfigStore: Every configuration must be an object with properties identifier (string) and config; you passed ${JSON.stringify(config)} instead`);
            } else {
                this.config.set(config.identifier, config.config);
            }
        }
    }

    getConfig(identifier) {
        return this.config.get(identifier);
    }

    hasFeature(featureFlag) {
        return this.featureFlags.get(featureFlag) || false;
    }

}

