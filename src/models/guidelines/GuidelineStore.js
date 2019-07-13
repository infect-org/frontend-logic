import debug from 'debug';
import { observable, action } from 'mobx';
import Store from '../../helpers/store.js';

const log = debug('infect:GuidelineStore');

/**
 * Holds all guidelines for a tenant (e.g. «Schweiz. Ges. für Infektiologie»)
 */
export default class GuidelineStore extends Store {

    @observable selectedGuideline;

    /**
     * Adds a guideline to the store; automatically sets this.selectedGuideline to first guideline
     * added
     */
    @action add(guideline, ...params) {
        log('Add guideline %o', guideline);
        super.add(guideline, ...params);
        if (!this.selectedGuideline) this.selectedGuideline = guideline;
    }

    /**
     * Updates the currently selected guideline
     * @param {Guideline} [selectedGuideline]
     */
    @action selectGuideline(selectedGuideline) {
        this.selectedGuideline = selectedGuideline;
    }

}
