import { observable, action } from 'mobx';
import types from './resistanceTypes';

export default class {

	@observable quantitativeData = {};

	/**
	* @param {String} type				See resistanceTypes
	* @param {Number} value				Value between 0 and 1
	* @param {Int} sampleSize			Sample Size
	* @param {Array} confidenceInterval	95% confidence interval, if available: [lower, upper]
	* @param {Object} data				Any additional data whose properties will be attached to
	*									ResistanceValue
	*/
	constructor(type, value, sampleSize, confidenceInterval, data) {
		if (!types[type]) throw new Error(`ResistanceValue: Type ${type} not known, use one of ${Object.keys(types).join(', ')}.`);
		if (value !== undefined && typeof value !== 'number') throw new Error(`ResistanceValue: value must either be undefined if it's unknown at the current time or a number; is ${value} instead.`);
		if (sampleSize % 1 !== 0) throw new Error(`ResistanceValue: Sample size must be an integer`);
		if (data && (typeof data !== 'object' || data === null)) {
			throw new Error(`ResistanceValue: If data is passed, it must be an object; you passed ${JSON.stringify(data)} instead.`);
		}

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
				throw new Error(`ResistanceValue: Confidence interval must embrace the resistance value; resistance is ${value}, lower confidence interval is ${lower} upper is ${upper}.`);
			}
		}

		// Set properties
		this.type = types[type];
		this.value = value;
		this.sampleSize = sampleSize;
		if (confidenceInterval) {
			this.confidenceInterval = confidenceInterval;
		}
		// Clone properties
		Object.assign(this, data);

	}

    /**
     * Adds quantititative data (MIC/discDiffusion) after resistance value was initialized
     */
	 @action setQuantitativeData(data) {

        // Do a simple validation to get the most obvious errors; server should be trustworthy
        // with its data structure
        if (
            !data ||
            data.percentile !== 90 ||
            typeof data.percentileValue !== 'number'
        ) {
            throw new Error(`Resistance: Quantitative data does not fulfill the expected base format, is ${JSON.stringify(data)}`);
        }
        if (
            typeof data.rangeMin !== 'number' ||
            typeof data.rangeMax !== 'number' ||
            !Array.isArray(data.slots)
        ) {
            throw new Error(`Resistance: Quantitative data does not fulfill the expected slot format, is ${JSON.stringify(data.slots)}`);
        }
        if (
            !data.slots.every(item => typeof item.value === 'number' &&
                typeof item.sampleCount === 'number')
        ) {
            throw new Error(`Resistance: Quantitative slot entries do not fulfill the expected format, are ${JSON.stringify(data.slots)}`);
        }

        this.quantitativeData = data;
    }

}
