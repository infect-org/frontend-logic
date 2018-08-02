import {computed} from 'mobx';
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

}