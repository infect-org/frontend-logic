import { computed } from 'mobx';
import doFiltersMatch from '../filters/doFiltersMatch';

export default class BacteriumMatrixView {

    constructor(bacterium, matrix) {
        this.bacterium = bacterium;
        this._matrix = matrix;
    }

    setWidth(width) {
        if (!width) return;
        this._matrix.setBacteriumLabelWidth(this, width);
    }

    @computed get visible() {
        const bacteriaFilters = this._matrix.selectedFilters.getFiltersByType('bacterium');
        const visible = doFiltersMatch(this.bacterium, bacteriaFilters);
        return visible;
    }

    /**
     * Checks if there is resistance data for this bacterium in the current (filtered) resistance
     * data set. Needed to deactivate (grey out) bacteria without data, especially for INFECT VET
     * where poultry has completely different bacteria than cats.
     * @return {Boolean}       True if there is resistance data for current bacterium, else false
     */
    @computed get hasResistanceData() {
        return this._matrix.resistances
            .findIndex(({ resistance }) => resistance.bacterium === this.bacterium) > -1;
    }

}
