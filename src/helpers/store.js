import { observable, action, computed, runInAction } from 'mobx';

/**
* Simple store for antibiotics, bacteria etc.
*/
export default class Store {

	// Use object so that we can add properties, e.g. an errorReason
	@observable _status = {
		// Default must be ready – as there is no fetchPromise that could resolve a loading status
		identifier: 'initialized'
	};

	/**
	* @param {Array} values					this.add is called for every value on initialization, therefore
	*										an array of items must be provided.
	* @param {Function} idGeneratorFunction	Function to generate a unique ID from the items passed in; takes
	*										item as an argument, must return a string, e.g.
	*										(item) => item.id_property1 + '/' + item.id_property2;
	*/
	constructor(values = [], idGeneratorFunction) {
		// Key: id, value: content. Use map to speed up lookups.
		this._items = observable.map();
		this._idGeneratorFunction = idGeneratorFunction;

		// If values are passed, add them
		values.forEach((item) => this.add(item));
	}

	getAsArray() {
		return Array.from(this._items.values());		
	}

	get() {
		return this._items;
	}

	/**
	* Needed for resistances that need to be cleared when new data is loaded.
	*/
	@action clear() {
		this._items.clear();
	}

	@action add(item, overwrite) {
		const id = this._getItemId(item);
		if (id === undefined) throw new Error(`Store: Field id is missing on item ${ JSON.stringify(item) }.`);
		if (!overwrite && this._items.has(id)) throw new Error(`Store: Tried to overwrite item with 
			id ${ id } without using the appropriate overwrite argument.`);
		this._items.set(id, item);
	}

	/**
	 * Returns id for a given item
	 */
	_getItemId(item) {
		return this._idGeneratorFunction ? this._idGeneratorFunction(item) : item.id;
	}

	@action remove(item) {
		const id = this._getItemId(item);
		this._items.delete(id);
	}

	getById(id) {
		return this._items.get(id);
	}

	/**
	 * Returns true if an item with the same ID as the passed item exists.
	 * @param {any}			Item to look for
	 * @return {boolean}
	 */
	hasWithId(item) {
		const id = this._getItemId(item);
		return !!this.getById(id);
	}

	/**
	* Add promise that fetches the store's data. Needed for resistances to observe status
	* of antibiotics/bacteria and resolve when (and not before) they are ready.
	*/
	@action setFetchPromise(promise) {
		if (!(promise instanceof Promise)) throw new Error(`Store: Argument passed to 
			setFetchPromise must be a Promise.`);
		this._status.identifier = 'loading';
		promise.then(() => {
			runInAction(() => this._status.identifier = 'ready');
		}, (err) => {
			runInAction(() => {
				this._status.identifier = 'error';
				this._status.errorMessage = err;
			});
		});
	}

	/**
	* Status is either 'loading' or 'ready', depending on fetchPromise.
	*/
	@computed get status() {
		return this._status;
	}

}