import test from 'tape';
import doFiltersMatch from './doFiltersMatch';


function createData() {
	const objects = [{
		name: 'name1'
		, boolean: true
	}, {
		name: 'name2'
		, boolean: true
	}];
	const filters = [{
		value: true
		, property: {
			name: 'boolean'
		}
	}, {
		value: 'name1'
		, property: {
			name: 'name'
		}
	}, {
		value: 'name2'
		, property: {
			name: 'name'
		}
	}];
	return {
		objects
		, filters
	};
}


test('throws on invalid arguments', (t) => {
	t.throws(() => doFiltersMatch(5), /be an object/);
	t.throws(() => doFiltersMatch({}, null), /be an array/);
	t.end();
});

test('returns matching objects', (t) => {
	const { objects, filters } = createData();
	t.equals(doFiltersMatch(objects[0], [filters[0]]), true);
	t.equals(doFiltersMatch(objects[1], [filters[0]]), true);
	t.equals(doFiltersMatch(objects[1], [filters[1]]), false);
	t.equals(doFiltersMatch(objects[1], [filters[2]]), true);
	t.end();
});

test('validates if any one filter of the same property matches', (t) => {
	const { objects, filters } = createData();
	t.equals(doFiltersMatch(objects[0], [filters[1], filters[2]]), true);
	t.end();
});

test('does not validate if any one filter does not match', (t) => {
	const { objects, filters } = createData();
	t.equals(doFiltersMatch(objects[0], [filters[0], filters[2]]), false);
	t.end();
});

test('matches if no filter is set', (t) => {
	const { objects, filters } = createData();
	t.equals(doFiltersMatch(objects[0], []), true);
	t.end();
});

