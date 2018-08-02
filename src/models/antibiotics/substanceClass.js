import { computed, observable, action } from 'mobx';
import debug from 'debug';
const log = debug('infect:SubstanceClass');

class SubstanceClass {

	@observable _used = false;

	constructor(id, name, parent, properties = {}) {

		const debugData = { id, name, parent, properties };
		log('Create SubstanceClass for data %o', debugData);

		if (id === undefined) throw new Error(`SubstanceClass: Constructor argument 'id' must be 
			set, is undefined for ${ JSON.stringify(debugData )}.`);
		if (typeof name !== 'string') throw new Error(`SubstanceClass: Argument 'name' must be
			a string, is ${ typeof name }. Arguments are ${ JSON.stringify(debugData )}.`);
		if (parent && !(parent instanceof SubstanceClass)) throw new Error(`SubstanceClass: parent 
			must be an instance of SubstanceClass, is %O`, parent);

		this.id = id;
		this.name = name;
		// Parent property shall not be set if not available (and not .parent = undefined)
		if (parent) this.parent = parent;

		// Expanded is true by default
		this.expanded = true;

		// Is the color property valid?
		if (properties.hasOwnProperty('color')) {
			const color = properties.color;
			if (typeof color !== 'string') throw new Error(`SubstanceClassComponent: Color must be a string, is ${ typeof color }.`);
			const split = color.split(/\s*\/\s*/);
			if (split.length !== 3) throw new Error(`SubstanceClassComponent: RGB color must consist of three parts, ${ color } is not valid.`);
			const formattedColor = {}, colorTypes = ['r', 'g', 'b'];
			split.forEach((part, index) => {
				const parsed = parseInt(part, 10);
				if (isNaN(parsed)) throw new Error(`SubstanceClassComponent: RGB value ${ part } is not a number`);
				if (parsed < 0 || parsed > 255) throw new Error(`SubstanceClassComponent: RGB value must be between 0 and 255, is ${ parsed }.`);
				formattedColor[colorTypes[index]] = parsed;
			});
			properties.color = formattedColor;
		}


		// Store properties
		Object.keys(properties).forEach((key) => {
			this[key] = properties[key];
		});

	}

	/**
	* Returns all parent substance classes, youngest (child) first.
	* @return {Array}		Array of substanceClass
	*/
	getParentSubstanceClasses() {
		const classes = [this];
		while(classes.slice(-1)[0].parent) {
			classes.push(classes.slice(-1)[0].parent);
		}
		return classes.slice(1);
	}

	@action setUsed(used) {
		this._used = used;
	}

	@computed get used() {
		return this._used;
	}


}

export default SubstanceClass;