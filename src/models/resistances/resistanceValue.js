import types from './resistanceTypes';

export default class {

	/**
	* @param {String} type				See resistanceTypes
	* @param {Number} value				Value between 0 and 1
	* @param {Int} sampleSize			Sample Size
	* @param {Array} confidenceInterval	95% confidence interval, if available: [lower, upper]
	*/
	constructor(type, value, sampleSize, confidenceInterval) {
		if (!types[type]) throw new Error(`ResistanceValue: Type ${type} not known, use one of ${Object.keys(types).join(', ')}.`);
		if (isNaN(parseFloat(value))) throw new Error(`ResistanceValue: Value passed is not a number.`);
		value = parseFloat(value);
		if (value < 0 || value > 1) throw new Error(`ResistanceValue: Value must be between 0 and 1, is ${value}.`);
		if (sampleSize % 1 !== 0) throw new Error(`ResistanceValue: Sample size must be an integer`);

		// Validate confidence interval
		if (confidenceInterval) {
			if (!Array.isArray(confidenceInterval)) throw new Error(`ResistanceValue: Confidence interval must be an array.`);
			if (confidenceInterval.length !== 2) throw new Error(`ResistanceValue: Confidence interval must contain two items`);
			const [lower, upper] = confidenceInterval;
			if (Number(lower) !== lower || Number(upper) !== upper) {
				throw new Error(`ResistanceValue: Confidence interval bounds must be numbers, are ${ lower }, ${ upper }.`);
			}
			if (lower > 1 || lower < 0 || upper > 1 || upper < 0 || lower > upper) {
				throw new Error(`ResistanceValue: Confidence interval numbers must be between 0 and 1, lower bound must be smaller than upper bound.`);
			} 
			if (lower > value || upper < value) {
				throw new Error(`ResistanceValue: Confidence interval must embrace the resistance value.`);
			}
		}

		// Set properties
		this.type = types[type];
		this.value = value;
		this.sampleSize = sampleSize;
		if (confidenceInterval) {
			this.confidenceInterval = confidenceInterval;
		}
	}
}