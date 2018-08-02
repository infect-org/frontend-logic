import { observable, computed, action } from 'mobx';

/**
* Stores filters for data (sample size, resistance value). Filtesr consist of ranges
* (min, max).
*/
export default class OffsetFilters {

	constructor() {
		this._filters = observable.map();
	}

	/**
	* Updates the filters; if it doesn't exist, creates it.
	* @param {String} dataType		Type of data to set value for (e.g. 'sampleSize', 'resistance')
	* @param {String} rangeType		Type of range – either 'max' or 'min' 
	* @param {Number} value			Value to set range to
	*/
	@action setFilter(dataType, rangeType, value) {
		if (!dataType) throw new Error(`OffsetFilters: dataType not set.`);
		const validRangeTypes = ['min', 'max'];
		if(!rangeType || validRangeTypes.indexOf(rangeType) === -1) {
			throw new Error(`OffsetFilters: Invalid rangeType, pass one of ${ validRangeTypes.join(',') }.`);
		}
		// Initialize filter for dataType if it was not set
		if (!this.filters.get(dataType)) {
			this.filters.set(dataType, {
				min: undefined
				, max: undefined
			});
		}
		this.filters.get(dataType)[rangeType] = value;
	}

	@computed get filters() {
		return this._filters;
	}

}