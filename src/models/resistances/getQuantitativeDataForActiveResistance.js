import { autorun } from 'mobx';
import getQuantitativeData from './getQuantitativeData.js';

let timeout;

const debounce = (callback) => {
    if (timeout) clearTimeout(timeout);
    // 50ms would be too short – requests data almost instantly.
    setTimeout(callback, 200);
};

/**
 * Gets quantitative data for active resistance after a short debounce; watches
 * matrixView.activeResistance and initializes fetch.
 */
export default (matrixView, getURL) => {
    autorun(() => {
        const { activeResistance } = matrixView;
        if (!activeResistance) return;
        if (!activeResistance.resistance) return;
        debounce(() => getQuantitativeData(activeResistance.resistance, false, getURL));
    });
};

