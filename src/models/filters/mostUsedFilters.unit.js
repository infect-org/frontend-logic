import test from 'tape';
import MostUsedFilters from './mostUsedFilters';
import { observable, action, makeObservable } from 'mobx';

function setupData() {
	class SelectedFilters {
        filterChanges = 0;
        originalFilters = [];

        constructor() {
            makeObservable(this, {
                filterChanges: observable,
                originalFilters: observable,
                addFilter: action,
                removeFilter: action
            });
        }

        addFilter(filter) {
			this.filterChanges++;
			this.originalFilters.push(filter);
		}
        removeFilter(filter) {
			this.originalFilters.splice(this.originalFilters.indexOf(filter), 1);
			this.filterChanges++;
		}
    }
	return {
		SelectedFilters
	};
}

test('watches filter changes', (t) => {
	const { SelectedFilters } = setupData();
	const selected = new SelectedFilters();
	const used = new MostUsedFilters(selected);
	t.equals(used.mostUsedFilters.length, 0);
	selected.addFilter('test1');
	t.equals(used.mostUsedFilters.length, 1);
	t.deepEquals(used.mostUsedFilters[0], {
		count: 1
		, filter: 'test1'
	});
	selected.addFilter('test2');
	t.equals(used.mostUsedFilters.length, 2);
	// no peek() method in mobx > 4, so we use slice
	t.deepEquals(used.mostUsedFilters.slice(), [{
			count: 2
			, filter: 'test1'
		}, {
			count: 1
			, filter: 'test2'
		}]);
	selected.removeFilter('test2');
	t.equals(used.mostUsedFilters.length, 2);
	// no peek() method in mobx > 4, so we use slice
	t.deepEquals(used.mostUsedFilters.slice(), [{
			count: 3
			, filter: 'test1'
		}, {
			count: 1
			, filter: 'test2'
		}]);
	t.end();
});