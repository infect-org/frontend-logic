import { transaction } from 'mobx';
import debug from 'debug';
import filterTypes from '../filters/filterTypes.js';

const log = debug('infect:GuidelineSelectedFiltersBridge');

/**
 * Adds all diagnosis-related filters (bacteria and antibiotics) to selectedFilters and checks if
 * all of them are selected.
 * We use a separate class/bridge as selectedFilters and guidelineStore should not know anything
 * about one another.
 */

export default class GuidelineSelectedFiltersBridge {

    /**
     * @param  {GuidelineStore} guidelineStore     The GuidelineStore instance of the InfectApp
     * @param  {SelectedFilters} selectedFilters   The SelectedFilters instance of the InfectApp
     * @param  {PropertyMap} filterValues          The PropertyMap instance of the InfectApp
     *                                             that contains all filter values.
     */
    constructor(guidelineStore, selectedFilters, filterValues) {
        this.guidelineStore = guidelineStore;
        this.selectedFilters = selectedFilters;
        this.filterValues = filterValues;
    }

    /**
     * Returns all entries of this.filterValues that are related to the selected diagnosis.
     * @return {Object[]}    Matches in this.filterValues for selected diagnosis
     * @private
     */
    getFilterValuesRelatedToSelectedDiagnosis() {
        const selectedDiagnosis = this.guidelineStore.getSelectedDiagnosis();
        if (!selectedDiagnosis) return [];
        // As we want to display filters that contain the bacteria/antibiotic's name (and not their
        // id e.g.), we have to select them by their name property; let's assume they're unique.
        const bacteriaNames = selectedDiagnosis.inducingBacteria.map(({ name }) => name);
        const antibioticsNames = selectedDiagnosis.therapies
            .reduce((prev, therapy) => (
                [...prev, ...therapy.recommendedAntibiotics]
            ), [])
            .map(({ antibiotic }) => antibiotic.name);
        log(
            'Diagnosis is %o, names of antibiotics are %o and of bacteria %o',
            selectedDiagnosis,
            antibioticsNames,
            bacteriaNames,
        );
        const bacteriaFilters = this.filterValues
            .getValuesForProperty(filterTypes.bacterium, 'name')
            .filter(filterItem => bacteriaNames.includes(filterItem.value));
        const antibioticFilters = this.filterValues
            .getValuesForProperty(filterTypes.antibiotic, 'name')
            .filter(filterItem => antibioticsNames.includes(filterItem.value));
        log(
            'Matching filters are bacteria %o and antibiotics %o',
            bacteriaFilters,
            antibioticFilters,
        );
        return [...bacteriaFilters, ...antibioticFilters];
    }

    /**
     * Adds all antibiotic and bacteria name filters that may cause the selected
     * diagnosis or are recommended for its treatment to selectedFilter.
     */
    selectFiltersRelatedToSelectedDiagnosis() {
        const relatedFilters = this.getFilterValuesRelatedToSelectedDiagnosis();
        transaction(() => {
            relatedFilters.forEach((bacteriumFilter) => {
                this.selectedFilters.addFilter(bacteriumFilter);
            });
        });
    }

    /**
     * Checks if *all* bacteria and antibiotic name filters that may cause the selected diagnosis
     * or are recommended for its treatment are selected.
     * @return {boolean}    True if *all* filters are selected, else false
     */
    areAllDiagnosisRelatedFiltersSelected() {
        return this
            .getFilterValuesRelatedToSelectedDiagnosis()
            .every(filter => this.selectedFilters.isSelected(filter));
    }

}

