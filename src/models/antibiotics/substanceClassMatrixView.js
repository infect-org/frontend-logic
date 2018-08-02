import color from 'tinycolor2';
import { computed } from 'mobx';
import doFiltersMatch from '../filters/doFiltersMatch';

class SubstanceClassMatrixView {

	constructor(substanceClass, matrixView) {
		this.substanceClass = substanceClass;
		this._matrixView = matrixView;
	}

	@computed get lineColor() {
		const parents = this.substanceClass.getParentSubstanceClasses().length;
		const rank = parents;
		const colorValue = color.fromRatio({
			h: 0
			, s: 0
			, l: rank / this._matrixView.maxAmountOfSubstanceClassHierarchies * 0.6 + 0.4
		});
		return colorValue;
	}

	@computed get xPosition() {
		return this._matrixView.xPositions.get(this);
	}

	/*@computed get visible() {
		// Substance class itself is filtered out
		const substanceClassFilters = this._matrix.selectedFilters.getFiltersByType('substanceClass');
		if (!doFiltersMatch(this.substanceClass, substanceClassFilters)) return false;
		const antibiotics = this._matrix.antibiotics.filter((antibiotic) => {
			const parentIds = antibiotic.antibiotic.
		});
	}*/

}

export default SubstanceClassMatrixView;

