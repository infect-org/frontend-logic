import InfectApp from './src/infectApp';
import filterTypes from './src/models/filters/filterTypes';
import resistanceTypes from './src/models/resistances/resistanceTypes';
import storeStatus from './src/helpers/storeStatus.js';
import notificationSeverityLevels from './src/models/notifications/notificationSeverityLevels.js';

// Export models. Needed in App to check if value returned by xPositions is an Antibiotic or
// SubstanceClass
import AntibioticMatrixView from './src/models/antibiotics/antibioticMatrixView';

const models = {
    AntibioticMatrixView,
};

export {
    InfectApp as default,
    filterTypes,
    resistanceTypes,
    models,
    storeStatus,
    notificationSeverityLevels as severityLevels,
};

