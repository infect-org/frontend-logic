import {observable, computed} from 'mobx';

export default class Antibiotic {

	/**
	* @param {Number|String} id
	* @param {String} name
	* @param {SubstanceClass|undefined} substanceClass
	*/
	constructor(id, name, substanceClass, properties = {}) {

		if (!id || !name) throw new Error('Antibiotic: Arguments missing');
		if (!substanceClass) throw new Error(`Antibiotic: Substance class must be provided`);

		this.id = id;
		this.name = name;
		this.substanceClass = substanceClass;

		// Add properties
		Object.keys(properties).forEach((key) => {
			this[key] = properties[key];
		});

		// There are substanceClasses in our database that are not used by antibiotics. 
		// Mark the ones that are used as «used» – the others will not be added to the filters.
		this.getSubstanceClasses().forEach((substanceClass) => {
			substanceClass.setUsed(true);
		});

	}



	/**
	* Returns substance class hierarchy of this antibiotic as an array – traverse substanceClass.parent
	* until parent is undefined.
	* @returns {Array} Substance classes			[child, parent, grandparent] where every entry is
	*												an instance of SubstanceClass
	*/
	getSubstanceClasses() {
		// Get all parent substanceClasses and push their name 
		// into classes, bottom up
		return [this.substanceClass].concat(this.substanceClass.getParentSubstanceClasses());
	}

}