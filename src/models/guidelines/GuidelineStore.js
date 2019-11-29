import debug from 'debug';
import { observable, action } from 'mobx';
import Store from '../../helpers/Store.js';
import searchDiagnoses from './searchDiagnoses.js';

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

    /**
     * Returns the selected diagnosis, if one is set, else undefined. Quick access method
     * to simplify calls from components.
     * @return {Diagnosis|undefined}    Selected diagnosis, if any
     */
    getSelectedDiagnosis() {
        return this.selectedGuideline &&
            this.selectedGuideline.selectedDiagnosis;
    }

    /**
     * Searches all guidelines for a certain diagnosis. As search should happen across all
     * guidelines and only GuidelineStore is exposed on infectApp, we execute the search here.
     */
    search(searchTerm) {
        return searchDiagnoses(this.getAsArray(), searchTerm);
    }

}
