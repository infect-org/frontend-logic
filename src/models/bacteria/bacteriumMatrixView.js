import { computed, observable, action } from 'mobx';
import doFiltersMatch from '../filters/doFiltersMatch';

export default class BacteriumMatrixView {

    @observable dimensions = {
        width: -1,
        height: -1,
    }

    constructor(bacterium, matrix) {
        this.bacterium = bacterium;
        this.matrix = matrix;
    }

    @action setWidth(width) {
        this.dimensions.width = width;
        // Fake-Update height so that all bacteria seem to have been measured (for matrixView)
        // TODO: Update correctly
        this.dimensions.height = 1;
    }

    @computed get visible() {
        const bacteriaFilters = this.matrix.selectedFilters.getFiltersByType('bacterium');
        return doFiltersMatch(this.bacterium, bacteriaFilters);
    }

}
