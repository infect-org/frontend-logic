/**
 * Adds all diagnosis-related filters (bacteria and antibiotics) to selectedFilters and checks if
 * all of them are selected.
 * We use a separate class/bridge as selectedFilters and guidelineStore should not know anything
 * about one another.
 */

export default class GuidelineSelectedFiltersBridge {

    constructor(guidelineStore, selectedFilters, filterValues) {
        this.guidelineStore = guidelineStore;
        this.selectedFilters = selectedFilters;
        this.filterValues = filterValues;
    }

    selectDiagnosisRelatedFilters() {
        // const bacteria = guidelineStore.
    }

    areAllDiagnosisRelatedFiltersSelected() {

    }

}

