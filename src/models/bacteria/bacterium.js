import { computed, action, observable } from 'mobx';

class Bacterium {

	/**
	* Some bacteria don't have any data for resistances – they are empty lines. Whenever a resistance
	* is initialized, it calls setHasDataForResistance. We'll filter the matrix by this property.
	*/
	@observable _hasDataForResistances = false;

	constructor(id, name, properties = {}) {

		const debugData = { id, name, properties };
		if (id === undefined) throw new Error(`Bacterium: Constructor argument id is required, 
			is currently ${ id } for ${ JSON.stringify(debugData) }.`);
		if (typeof name !== 'string') throw new Error(`Bacterium: Constructor argument name must
			be a string, is currently ${ typeof name } for ${ JSON.stringify(debugData) }.`);

		this.id = id;
		this.name = name;

		// Add properties
		Object.keys(properties).forEach((key) => {
			this[key] = properties[key];
		});

	}

}

export default Bacterium;