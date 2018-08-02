import { observable, action, computed, reaction } from 'mobx';

/**
* Enhances an array: Holds values (in an array) that can be easily retrieved by
* the getBy(config) function which returns all values that match the config.
*/
export default class SearchableMap {

	/*constructor() {
		reaction(() => this._values.length, (length) => {
			console.error(length);
		});
	}*/

	/**
	* Only use shallow observation as the relevant values (Array items) won't change. 
	* If we don't, comparing items (getBy) is impossible/difficult for objects as 
	* all items in a non-shallowly watched array are being watched/modified when added.
	*/
	@observable.shallow _values = [];

	@computed get values() {
		// See https://mobx.js.org/refguide/array.html
		return this._values.peek();
	}

	set values(item) {
		throw new Error(`SearchableMap: Use add method to add items.`);
	}

	@action add(item) {
		if (!item || typeof item !== 'object') {
			throw(`SearchableMap: Only add objects; type added is ${ typeof item }.`);
		}
		this._values.push(item);
		// Return added item – as if we were calling getById with params for the 
		// current item
		return [item];
	}

	@action remove(config) {
		throw new Error(`SearchableMap: remove method was not yet implemented.`);
	}

	/**
	* @param {Object} config		Key: name, value: value of item to find, e.g.
	*								{
	*									name: 'nameValue',
	*									, entityName: 'entityNameValue'
	*								}
	*/
	getBy(config) {
		const result = this._values.filter((item) => {
			return Object.keys(config).every((key) => {
				return item.hasOwnProperty(key) && item[key] === config[key];
			});
		});
		return result;
	}

}