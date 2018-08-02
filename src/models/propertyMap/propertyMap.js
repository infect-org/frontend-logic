import SearchableMap from './searchableMap';
import { computed } from 'mobx';
import debug from 'debug';
import Fuse from 'fuse.js';
const log = debug ('infect:PropertyMap');

/**
* Creates a map of properties of instances/objects so that they can be 
* - searched
* - filtered by (and be displayed in a filter list)
* Creates entries for properties (e.g. gram) and values (e.g. gram-). Objects (e.g. antibiotics) 
* will be filtered by checking if its property $property has value $value.
*/
export default class PropertyMap {

	/**
	* We want to search by property values – use them as keys so that they can be 
	* easily found.
	*/
	constructor() {

		// Objects with properties: name, niceName and entityType; e.g.
		// {
		//   name: 'gram', // This is the property on the bacterium we'll be filtering for
		//   niceName: 'Gram',
		//   entityType: 'bacterium'
		// }
		this._properties = new SearchableMap();
		// Objects with property values: value, niceValue and property (link to a property in 
		// this._properties), e.g. 
		// {
		//   name: 'gram+', // This is the value we'll be filtering for
		//   niceName: 'Gram +'
		//   property: { see property above }
		// }
		this._propertyValues = new SearchableMap();
		this._configurations = {};

		this._fuseOptions = {
			shouldSort: true
			, threshold: 0.3
			, tokenize: true
			, minMatchCharLength: 1
			, keys: [
				{ name: 'niceValue', weight: 0.7 }
				, { name: 'property.niceName', weight: 0.3 }
			]
		};

	}


	@computed get propertyValues() {
		return this._propertyValues;
	}

	/**
	* Returns all values for a certain entityType and propertyName. Needed to display
	* filter lists.
	* @return {Array}
	*/
	getValuesForProperty(entityType, propertyName) {
		const property = this._properties.getBy({ entityType: entityType, name: propertyName });
		if (!property.length) return [];
		return this._propertyValues.getBy({ property: property[0] });			
	}


	/**
	* Returns all properties for a certain entity type.
	* @return {Array}
	*/
	getPropertiesForEntityType(entityType) {
		return this._properties.getBy({ entityType: entityType });
	}


	/**
	* Adds a configuration for an certain entity type. 
	* @param {String} entityType
	* @param {Object} config			Object with an property per property that should be added from entity:
	*									  { 
	*										[propertyName]: {
	*											translation: 'PropertyNameTranslation'
	*											, valueTranslations: [
	*												{value: 'value', translation: 'translation' }
	*											]
	*									  } 
	*/
	addConfiguration(entityType, config) {
		this._configurations[entityType] = config;
	}


	/**
	* Parses an entity and adds filters
	*/
	addEntity(entityType, entity, valueTranslationFunction) {
		const config = this._configurations[entityType];
		if (!config) {
			throw new Error(`PropertyMap: Before you can add an entity, you have to provide a configuration matching it.`);
		}

		const properties = Object.keys(entity);
		properties.forEach((property) => {

			// Only add properties that are part of a config
			if (!config[property]) return;

			// Get/create property
			let existingProperties = this._properties.getBy({ entityType: entityType, name: property });
			if (!existingProperties.length) {
				const niceName = this._getTranslation(config[property].translation, property);
				existingProperties = this._properties.add({ entityType: entityType, name: property, niceName: niceName });
			}

			// Get/create value
			const value = entity[property];
			const existingValues = this._propertyValues.getBy({ property: existingProperties[0], value: value });
			// Value exists
			if (existingValues.length) return;

			const valueTranslations = config[property].valueTranslations;
			let niceValueName;
			// valueTranslations is a function (one for all values)
			if (typeof valueTranslations === 'function') {
				niceValueName = this._getTranslation(valueTranslations, value, entity);
			}
			// valueTranslations is an array; get item for the current value
			else if (Array.isArray(valueTranslations)) {
				niceValueName = this._getTranslation(valueTranslations.find((item) => item.value === value).translation, value, entity);
			}
			else {
				throw(`PropertyMap: Unknown type of valueTranslations; needs to be an Array or a Function, is ${ valueTranslations }.`);
			}

			const newEntity = { property: existingProperties[0], value: value, niceValue: niceValueName };
			log('Added %o, entity was %o', newEntity, entity);
			this._propertyValues.add(newEntity);

		});

	}


	/**
	* Performs a fulltext search with Fuse.js
	*/
	search(searchTerm) {
		const fuse = new Fuse(this._propertyValues.values, this._fuseOptions);
		const results = fuse.search(searchTerm);
		return results;
	}


	/**
	* We can provide a string or a function as translation; check which is given and return
	* corresponding value.
	* @param {String|Function} translation
	* @param {String} value
	* @param {Object} entity			The original entity (to translate regions which consist of
	*                          			IDs; we cannot get from an ID to the region's name)
	*/
	_getTranslation(translation, value, entity) {	
		if (!translation) {
			console.warn(`PropertyMap: Translation for value ${ value } is missing; return original value.`);
			return value;
		}
		if (typeof translation === 'string') return translation;
		if (typeof translation === 'function') return translation(value, entity);
	}

}



