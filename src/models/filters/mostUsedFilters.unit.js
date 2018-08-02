import test from 'tape';
import MostUsedFilters from './mostUsedFilters';
import { observable, action } from 'mobx';

function setupData() {
	class SelectedFilters {
		@observable filterChanges = 0;
		@observable originalFilters = [];
		@action addFilter(filter) {
			this.filterChanges++;
			this.originalFilters.push(filter);
		}
		@action removeFilter(filter) {
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
	t.deepEquals(used.mostUsedFilters.peek(), [{
			count: 2
			, filter: 'test1'
		}, {
			count: 1
			, filter: 'test2'
		}]);
	selected.removeFilter('test2');
	t.equals(used.mostUsedFilters.length, 2);
	t.deepEquals(used.mostUsedFilters.peek(), [{
			count: 3
			, filter: 'test1'
		}, {
			count: 1
			, filter: 'test2'
		}]);
	t.end();
});