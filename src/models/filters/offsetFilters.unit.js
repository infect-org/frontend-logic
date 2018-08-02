import test from 'tape';
import OffsetFilters from './offsetFilters';

test('throws on invalid arguments', (t) => {
	const offsetFilters = new OffsetFilters();
	t.throws(() => offsetFilters.setFilter(), /dataType/);
	t.throws(() => offsetFilters.setFilter('type'), /rangeType/);
	t.throws(() => offsetFilters.setFilter('type', 'invalid'), /rangeType/);
	t.end();
});

test('stores filters', (t) => {
	const offsetFilters = new OffsetFilters();
	offsetFilters.setFilter('sampleSize', 'min', 50);
	t.equals(offsetFilters.filters.get('sampleSize').min, 50);
	t.equals(offsetFilters.filters.get('sampleSize').max, undefined);
	t.end();
});