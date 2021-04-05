import { autorun } from 'mobx';
import getQuantitativeData from './getQuantitativeData.js';

/**
 * Fetches qualitative data as soon as a resistance is being displayed in the drawer.
 */
export default (drawerViewModel, getURL) => {
    autorun(() => {
        if (drawerViewModel.contentType !== 'resistance') return;
        const { content } = drawerViewModel;
        getQuantitativeData(content, getURL);
    });
};
