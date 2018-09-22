import InfectApp from './src/infectApp';
import filterTypes from './src/models/filters/filterTypes';
import errorHandler from './src/models/errorHandler/errorHandler';
import resistanceTypes from './src/models/resistances/resistanceTypes';

// Export models. Needed in App to check if value returned by xPositions is an Antibiotic or
// SubstanceClass
import AntibioticMatrixView from './src/models/antibiotics/antibioticMatrixView';

const models = {
    AntibioticMatrixView,
};

export { InfectApp as default, filterTypes, errorHandler, resistanceTypes, models };

