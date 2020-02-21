import test from 'tape';
import setupAgeGroups from './setupAgeGroups.js';
import PropertyMap from '../propertyMap/propertyMap.js';
import getFilterConfig from '../filters/getFilterConfig.js';
import TenantConfigStore from '../tenantConfig/TenantConfigStore.js';
import Store from '../../helpers/Store.js';
import filterTypes from '../filters/filterTypes.js';

const setupData = () => {

    const tenantConfig = {
        configuration: [{
            identifier: 'frontend',
            config: {
                rda: {
                    ageGroups: [{
                        label: 'young',
                        order: 0,
                        daysFrom: 0,
                        daysTo: 12775,
                    }, {
                        label: 'old',
                        order: 2,
                        daysFrom: 12776,
                        daysTo: 36500,
                    }],
                },
            },
        }],
    };
    const tenantConfigStore = new TenantConfigStore();
    let resolveFetchPromise;
    const fetchPromise = new Promise((resolve) => {
        resolveFetchPromise = resolve;
    });
    tenantConfigStore.setFetchPromise(fetchPromise);

    const notifications = [];
    const handleNotificaiton = notification => notifications.push(notification);

    const filterValues = new PropertyMap();
    getFilterConfig().forEach((entityConfig) => {
        filterValues.addConfiguration(entityConfig.entityType, entityConfig.config);
    });

    const ageGroupStore = new Store();

    return {
        tenantConfigStore,
        tenantConfig,
        filterValues,
        notifications,
        handleNotificaiton,
        resolveFetchPromise,
        ageGroupStore,
    };

};



test('stores age groups as expected', (t) => {
    const {
        tenantConfigStore,
        tenantConfig,
        filterValues,
        notifications,
        handleNotificaiton,
        resolveFetchPromise,
        ageGroupStore,
    } = setupData();

    setupAgeGroups(
        tenantConfigStore,
        filterValues,
        ageGroupStore,
        handleNotificaiton,
    );

    // Nothing happens before tenantConfig status is 'ready'
    t.is(ageGroupStore.getAsArray().length, 0);

    tenantConfigStore.setData(tenantConfig);
    resolveFetchPromise();


    setTimeout(() => {
        t.is(notifications.length, 0);
        t.is(ageGroupStore.getAsArray().length, 2);
        t.deepEqual(ageGroupStore.getAsArray()[0], {
            label: 'young',
            order: 0,
            daysFrom: 0,
            daysTo: 12775,
            id: 0,
        });
        const values = filterValues.getValuesForProperty(filterTypes.ageGroup, 'id');
        t.is(values.length, 2);
        t.is(values[0].value, 0);
        t.is(values[0].niceValue, 'young');
        t.end();
    });

});



test('displays errors as expected', (t) => {
    const {
        tenantConfigStore,
        tenantConfig,
        filterValues,
        notifications,
        handleNotificaiton,
        resolveFetchPromise,
        ageGroupStore,
    } = setupData();

    setupAgeGroups(
        tenantConfigStore,
        filterValues,
        ageGroupStore,
        handleNotificaiton,
    );

    tenantConfig.configuration[0].identifier = 'notFrontend';
    tenantConfigStore.setData(tenantConfig);
    resolveFetchPromise();

    setTimeout(() => {
        t.is(notifications.length, 1);
        t.is(notifications[0].message.includes('Age groups missing or invalid'), true);
        t.end();
    });

});

