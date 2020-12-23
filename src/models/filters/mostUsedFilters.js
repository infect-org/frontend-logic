import { action, observable, reaction, makeObservable } from 'mobx';

/**
* Watches selectedFilters, creates a top score. 
* Score is watched by localStorageBridge which can also add filters. 
*/
export default class MostUsedFilters {

	/**
	* Contains objects with count and filter. Filter is a filterValue. 
	*/
	mostUsedFilters = [];

	constructor(selectedFilters) {
        makeObservable(this, {
            mostUsedFilters: observable.shallow
        });

        // All filters available. Empty while data is being loaded.
        this._selectedFilters = selectedFilters;
        this._setupSelectedFiltersWatcher();
    }

	/**
	* Whenever selected filters change, add all selected filters to mostUsedFilters or update
	* the corresponding count. 
	* We don't only count filters as used when they are added, but whenever they are in use while 
	* another filter is changed.
	*/
	_setupSelectedFiltersWatcher() {
		reaction(() => this._selectedFilters.filterChanges, () => {
			const index = this._selectedFilters.originalFilters.forEach((selectedFilter) => {
				const existingFilter = this.mostUsedFilters.find((item) => item.filter === selectedFilter);
				if (existingFilter) existingFilter.count++;
				else {
					this.mostUsedFilters.push({
						filter: selectedFilter
						, count: 1
					});
				}
			});
		});
	}

}