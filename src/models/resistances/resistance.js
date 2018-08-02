import {observable} from 'mobx';
import ResistanceValue from './resistanceValue';

export default class Resistance {

	/**
	* Values for different resistanceTypes. Only values must be observable, antibiotics and bacteria are not going 
	* to change.
	*/
	@observable values = [];

	/**
	* @param {Array} values				Array of values, each an object with properties type, 
	*									value, sampleSize
	* @param {Antibiotic} antibiotic	Antibiotic
	* @param {Bacterium} bacterium		Bacterium
	*/
	constructor(values, antibiotic, bacterium) {
		if (!Array.isArray(values)) throw new Error(`Resistance: First argument must be an Array of resistance values`);
		if (!antibiotic) throw new Error(`Resistance: Argument antibiotic is required.`);
		if (!bacterium) throw new Error(`Resistance: Argument bacterium is required.`);
		values.forEach((value) => {
			this.values.push(new ResistanceValue(value.type, value.value, value.sampleSize, value.confidenceInterval));
		});
		this.antibiotic = antibiotic;
		this.bacterium = bacterium;
	}

	/**
	* Returns all resistance values, sorted by precision (see resistanceTypes)
	*/
	getValuesByPrecision() {
		return this.values.sort((a, b) => a.type.precision > b.type.precision ? -1 : 1);
	}

}