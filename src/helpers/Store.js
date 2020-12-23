import { observable, action, makeObservable } from 'mobx';
import BaseStore from './BaseStore.js';

/**
* Simple store for list-like entries (antibiotics, bacteria) etc. For other types of entries
* (non-list-like), extend from BaseStore.
*/
export default class Store extends BaseStore {

    /**
     * Stores all list-like items.
     * Key: id, value: content. Use map to speed up lookups.
     */
    _items = observable.map();

    /**
    * @param {Array} values                 this.add is called for every value on initialization,
    *                                       therefore an array of items must be provided.
    * @param {Function} idGeneratorFunction Function to generate a unique ID from the items passed
    *                                       in. Takes item as an argument, must return a string,
    *                                       e.g. (item) => item.prop1 + '/' + item.prop2;
    */
    constructor(values = [], idGeneratorFunction) {
        super();

        makeObservable(this, {
            clear: action,
            add: action,
            remove: action
        });

        this._idGeneratorFunction = idGeneratorFunction;

        // If values are passed, add them
        values.forEach(item => this.add(item));
    }


    /**
     * Returns all of the store's items as an array
     * @return {*[]}     All the store's items
     */
    getAsArray() {
        return Array.from(this._items.values());
    }


    /**
     * Returns all items as a map
     * @return {Map.<*,*>}    Map with id as key and item as value
     */
    get() {
        return this._items;
    }

    /**
    * Needed for resistances that need to be cleared when new data is loaded.
    */
    clear() {
        this._items.clear();
    }

    /**
     * Adds an item to the store
     * @param {*} item              The item to add
     * @param {boolean} overwrite   True if you want to overwrite a (possibly) existing item with
     *                              the same id. Defaults to false. If you try to overwrite an
     *                              existing item, an error is thrown.
     */
    add(item, overwrite) {
        const id = this._getItemId(item);
        if (id === undefined) {
            throw new Error(`Store: Field id is missing on item ${JSON.stringify(item)}.`);
        }
        if (!overwrite && this._items.has(id)) {
            throw new Error(`Store: Tried to overwrite item with id ${id} without using the appropriate overwrite argument.`);
        }
        this._items.set(id, item);
    }

    /**
     * Returns id for a given item
     */
    _getItemId(item) {
        return this._idGeneratorFunction ? this._idGeneratorFunction(item) : item.id;
    }

    /**
     * Removes an item from store
     * @param  {*} item     The item you want to remove
     */
    remove(item) {
        const id = this._getItemId(item);
        this._items.delete(id);
    }

    /**
     * Returns element with ID id
     * @param  {*} id      ID of the element we're looking for
     * @return {*}         Item found for ID passed in
     */
    getById(id) {
        return this._items.get(id);
    }

    /**
     * Returns true if an item with the same ID as the passed item exists.
     * @param {any}         Item to look for
     * @return {boolean}
     */
    hasWithId(item) {
        const id = this._getItemId(item);
        return !!this.getById(id);
    }

}

