import { observable, action, computed, makeObservable } from 'mobx';
import deepEqual from 'deep-equal';
import debug from 'debug';
const log = debug('infect:SelectedFilters');

/**
* Just holds the filters that the user selected, which derive from a PropertyMap
*/
export default class SelectedFilters {
    /**
	* Array that holds the selected filters. Use shallow so that the items of the
	* array stay comparable; if we don't use shallow, they will be converted into
	* observables too.
	*/
    _selectedFilters = [];

    /**
	* Note amount of times the filters changed. Why? Because we want to start the animations
	* only when filters change (and not while the matrix is setting up). The components will
	* therefore watch this property and only transition when it's > 0.
	* Also used to allow reactions that react to filter changes as _selectedFilters is only
	* shallowly observed and doesn't fire reactions on change. See ResistancesFetcher.
	*/
    filterChanges = 0;

    constructor() {
        makeObservable(this, {
            _selectedFilters: observable.shallow,
            filterChanges: observable,
            addFilter: action,
            removeFilter: action,
            toggleFilter: action,
            filters: computed,
            originalFilters: computed,
            removeAllFilters: action
        });
    }

    addFilter(filter) {
		// no peek() method in mobx > 4, so we use slice
		log('Add filter %o, filters were %o', filter, this._selectedFilters.slice());

		// Prevent users from adding the same filter twice
		const duplicate = this._selectedFilters.find((item) => deepEqual(item, filter));
		if (duplicate) {
			console.warn('Tried to add duplicate entry %o', filter);
			return;
		}

		this.filterChanges++;
		this._selectedFilters.push(filter);
		log('Added filters, are now %o', this._selectedFilters);
	}

    removeFilter(filter) {
		// no peek() method in mobx > 4, so we use slice
		log('Remove filter %o, filters are %o', filter, this._selectedFilters.slice());
		const index = this._selectedFilters.indexOf(this.findFilter(filter));
		if (index === -1) {
			log('Filter %o not found in selectedFilters %o', filter, this._selectedFilters);
			return;
		}
		this.filterChanges++;
		this._selectedFilters.splice(index, 1);
	}

    toggleFilter(filter) {
		log('Toggle filter %o', filter);
		this.isSelected(filter) ? this.removeFilter(filter) : this.addFilter(filter);
	}

    /**
	* Returns a filter that equals the filter passed or null
	*/
    findFilter(filter) {
		return this._selectedFilters.find((item) => item === filter);
	}

    /**
	* Returns true if a filter that equals filter is selected
	*/
    isSelected(filter) {
		const selected = this.findFilter(filter);
		log('Is filter %o selected? %o', filter, !!selected);
		return !!selected;
	}

    get filters() {
		// no peek() method in mobx > 4, so we use slice
		return this._selectedFilters.slice();
	}

    get originalFilters() {
		return this._selectedFilters;
	}

    removeAllFilters() {
		log('Remove all filters');
		this.filterChanges++;
		this._selectedFilters.splice(0, this._selectedFilters.length);
	}

    /**
	* Returns all filters for a certain entityType
	*/
    getFiltersByType(entityType) {
		return this._selectedFilters.filter((item) => {
			return item.property.entityType === entityType;
		});
	}
}

