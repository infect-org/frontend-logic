import { computed, observable, action } from 'mobx';
import debug from 'debug';
import doFiltersMatch from '../filters/doFiltersMatch';

const log = debug('infect:AntibioticMatrixView');

/**
* Representation of an antibiotic in the matrix view. Holds e.g. a visible value as it does
* not apply to filters (where an ab is always visible), but only to the matrix.
*/
export default class AntibioticMatrixView {

    @observable dimensions = {
        width: -1,
        height: -1,
    };

    constructor(antibiotic, matrixView) {
        this.antibiotic = antibiotic;
        this.matrixView = matrixView;
    }

    @action setDimensions(width, height) {
        log(`Set dimensions of ${this.antibiotic.name} to ${width}/${height}`);
        this.dimensions.width = width;
        this.dimensions.height = height;
    }

    @computed get visible() {
        const abFilters = this.matrixView.selectedFilters.getFiltersByType('antibiotic');
        const abVisible = doFiltersMatch(this.antibiotic, abFilters);
        if (!abVisible) return false;
        // If any one of the substanceClasses is visible, display antibiotic
        const scs = this.antibiotic.getSubstanceClasses();
        const scFilters = this.matrixView.selectedFilters.getFiltersByType('substanceClass');
        const scVisible = scs.some(sc => doFiltersMatch(sc, scFilters));
        return scVisible;
    }

}
