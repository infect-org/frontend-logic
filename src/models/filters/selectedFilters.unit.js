import test from 'tape';
import SelectedFilters from './selectedFilters';

function setupFilters() {
	const sf = new SelectedFilters();
	const value1 = {value: 1};
	const value2 = {value: 2};
	sf.addFilter(value1);
	sf.addFilter(value2);
	return {
		filter: sf
		, values: [value1, value2]
	};
}

test('add and return filters', (t) => {
	const { filter, values } = setupFilters();
	t.deepEquals(filter.filters, values);
	t.end();
});

test('does not add filters twice', (t) => {
	const { filter, values } = setupFilters();
	filter.addFilter({ value: 1 });
	t.deepEquals(filter.filters, values);
	t.end();
});

test('remove filters', (t) => {
	const { filter, values } = setupFilters();
	filter.removeFilter(values[0]);
	t.deepEquals(filter.filters, [values[1]]);
	t.end();
});

/*test('remove similar filters', (t) => {
	const { filter, values } = setupFilters();
	filter.removeFilter(Object.assign({}, values[0]));
	t.deepEquals(filter.filters, [values[1]]);
	t.end();
});*/

test('is selected', (t) => {
	const { filter, values } = setupFilters();
	t.equals(filter.isSelected(values[0]), true);
	// Deep-equal
	//t.equals(filter.isSelected(Object.assign({}, values[1])), true);
	t.equals(filter.isSelected({ values: 3 }), false);
	t.equals(filter.isSelected({ values: 1 }), false);
	t.end();
});

test('finds filter', (t) => {
	const { filter, values } = setupFilters();
	// Deep-equal
	//t.equals(filter.findFilter(Object.assign({}, values[0])), values[0]);
	t.equals(filter.findFilter(values[0]), values[0]);
	t.end();
});

test('filters for a certain type', (t) => {
	const sf = new SelectedFilters();
	const abFilter = {
		property: {
			entityType: 'antibiotic'
		}
		, value: 1
	};
	sf.addFilter(abFilter);
	sf.addFilter({
		property: {
			entityType: 'bacterium'
		}
		, value: 2
	});
	t.deepEquals(sf.getFiltersByType('antibiotic'), [abFilter]);
	t.end();
});

test('removes all filters', (t) => {
	const { filter, values } = setupFilters();
	t.equals(filter.filters.length, 2);
	filter.removeAllFilters();
	t.equals(filter.filters.length, 0);
	t.end();
});

test('toggles filters', (t) => {
	const { filter, values } = setupFilters();
	filter.toggleFilter(values[0]);
	t.deepEquals(filter.filters, [values[1]]);
	filter.toggleFilter(values[0]);
	t.deepEquals(filter.filters, [values[1], values[0]]);
	filter.toggleFilter(values[0]);
	filter.toggleFilter(values[1]);
	t.equals(filter.filters.length, 0);
	t.end();
});


test('returns originalFilters', (t) => {
	const { filter, values } = setupFilters();
	// no peek() method in mobx > 4, so we use slice
	t.deepEquals(filter.originalFilters.slice(), values);
	t.end();
});

test('counts filter changes', (t) => {
	const sf = new SelectedFilters();
	t.equals(sf.filterChanges, 0);
	const { filter, values } = setupFilters();
	t.equals(filter.filterChanges, 2);
	filter.removeFilter(values[0]);
	t.equals(filter.filterChanges, 3);
	filter.removeAllFilters();
	t.equals(filter.filterChanges, 4);
	t.end();
});


