import { autorun, reaction } from 'mobx';
import getQuantitativeData from './getQuantitativeData.js';

let timeout;

const debounce = (callback) => {
    if (timeout) clearTimeout(timeout);
    // 50ms would be too short – requests data almost instantly.
    setTimeout(callback, 400);
};

/**
 * Gets quantitative data for active resistance after a short debounce; watches
 * matrixView.activeResistance and initializes fetch.
 */
export default (matrixView, getURL, updater, drawerView) => {

    // When filterHeaders change, close drawer if it contains resistance data, as it would not be
    // updated and would therefore reflect outdated information (activeResistance is only
    // referenced from the drawer, as all resistances are changed when filterHeaders change).
    reaction(
        () => ([
            updater.filterHeaders,
        ]),
        () => {
            if (drawerView.contentType === 'resistance') {
                drawerView.setContent(undefined);
            }
        },
    );

    // Autorun when activeResistance (hover) or filterHeaders change
    autorun(() => {
        // Also watch filterHeaders (through autorun)
        updater.filterHeaders;
        const { activeResistance } = matrixView;
        if (!activeResistance || !activeResistance.resistance) return;
        debounce(() => getQuantitativeData(
            activeResistance.resistance,
            getURL,
            updater.filterHeaders,
        ));
    });

};

