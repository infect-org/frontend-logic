import { computed } from 'mobx';
import doFiltersMatch from '../filters/doFiltersMatch';

/**
* Representation of an antibiotic in the matrix view. Holds e.g. a visible value as it does
* not apply to filters (where an ab is always visible), but only to the matrix.
*/
class AntibioticMatrixView {

	constructor(antibiotic, matrixView) {
		this.antibiotic = antibiotic;
		this._matrixView = matrixView;
	}

	setDimensions(width, height) {
		this._matrixView.setAntibioticLabelDimensions(this, width, height);
	}

	@computed get visible() {
		const abFilters = this._matrixView.selectedFilters.getFiltersByType('antibiotic');
		const abVisible = doFiltersMatch(this.antibiotic, abFilters);
		if (!abVisible) return false;
		// If any one of the substanceClasses is visible, display antibiotic
		const scs = this.antibiotic.getSubstanceClasses();
		const scFilters = this._matrixView.selectedFilters.getFiltersByType('substanceClass');
		const scVisible = scs.some((sc) => doFiltersMatch(sc, scFilters));
		return scVisible;
	}

}

export default AntibioticMatrixView;