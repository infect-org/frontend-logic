import test from 'tape';
import types from './resistanceTypes';

test('provides types', (t) => {
	t.equal(typeof types, 'object');
	['default', 'import', 'class'].forEach((type) => {
		t.equal(types.hasOwnProperty(type), true);
	});
	t.end();
});

test('types have correct properties', (t) => {
	Object.values(types).forEach((type) => {
		t.deepEqual(Object.keys(type), ['identifier', 'precision']);
	});
	t.end();
});

test('types have the correct sort order', (t) => {
	const keys = Object.keys(types);
	const sorted = keys.sort((a, b) => types[a].precision > types[b].precision ? -1 : 1);
	t.deepEqual(sorted, ['import', 'class', 'default']);
	t.end();
});