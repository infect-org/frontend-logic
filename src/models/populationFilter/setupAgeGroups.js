import { reaction } from 'mobx';
import storeStatus from '../../helpers/storeStatus.js';
import filterTypes from '../filters/filterTypes.js';
import severityLevels from '../notifications/notificationSeverityLevels.js';

/**
 * Sets up age groups; those are *not* taken from an ageGroup endpoint but from the tenantConfig
 * because:
 * 1. they depend on the tenant (there are e.g. big differences between humans and animals)
 * 2. they resolve to numbers (age in days from/to)
 *
 * Let us rely on the given constructs (filterValues, store). Therefore we have to
 * 1. get ageGroups from tenantConfig
 * 2. add ageGroups to ageGroupStore
 * 3. add ageGroups to filterValues
 *
 * When a user is filtering by ageGroups, let's
 * 1. get the ageGroup data from the store (through the ID we added)
 * 2. prepare the rda filter accordingly
 */
export default (tenantConfig, filterValues, ageGroupStore, handleNotification) => {

    reaction(
        // Wait for tenantConfig
        () => tenantConfig.status.identifier,
        (statusIdentifier) => {

            // Only continue when all necessary data is available
            if (statusIdentifier !== storeStatus.ready) return;

            // Get tenantConfig.frontend.rda.ageGroups
            const frontendConfig = tenantConfig.getConfig('frontend');
            if (
                !frontendConfig ||
                !frontendConfig.rda ||
                !frontendConfig.rda.ageGroups
                // We cannot easily check if it's an array, as ageGroups is an observableArray
            ) {
                handleNotification({
                    message: `setupAgeGroups: Age groups missing or invalid on tenant config; expected Array under frontend.rda.ageGroups; frontend property is ${JSON.stringify(frontendConfig)}, however.`,
                    severity: severityLevels.warning,
                });
                return;
            }

            // Add age groups to filterValues and ageGroupStore
            frontendConfig.rda.ageGroups.forEach((ageGroup, index) => {
                // Stores need an ID; generate it from the ageGroup's index
                const ageGroupWithId = { ...ageGroup, id: index };
                ageGroupStore.add(ageGroupWithId);
                filterValues.addEntity(filterTypes.ageGroup, ageGroupWithId);
            });

        },
    );

};

