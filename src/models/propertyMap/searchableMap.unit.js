import test from 'tape';
import SearchableMap from './searchableMap';
import {reaction} from 'mobx';
import { observable } from 'mobx';

function createMap() {
	const map = new SearchableMap();
	const obj1 = {prop1: 'value1', prop2: 'value2' };
	const obj2 = {prop1: 'value1', prop3: 'value3' };
	map.add(obj1);
	map.add(obj2);
	return {
		map
		, objects: [obj1, obj2]
	};
}

test('throws if trying to set values', (t) => {
	const {map} = createMap();
	t.throws(() => map.values = 'test', /Use add/);
	t.end();
});

test('throws if non-object is added', (t) => {
	const {map} = createMap();
	t.throws(() => map.add('test'), /add objects/);
	t.end();
});

test('adds and returns items', (t) => {
	const {map, objects} = createMap();
	t.deepEqual(map.values, objects);
	t.end();
});

test('returns added items in array', (t) => {
	const {map} = createMap();
	const toAdd = { test: true };
	const added = map.add(toAdd);
	t.deepEquals([toAdd], added);
	t.end();
});

test('returns items for getBy', (t) => {
	const {map, objects} = createMap();
	t.deepEqual(map.getBy({prop1: 'value1'}), objects);
	t.deepEqual(map.getBy({prop2: 'value2'}), [objects[0]]);
	t.deepEqual(map.getBy({prop3: 'value3'}), [objects[1]]);
	t.end();
});

test('works with observables', (t) => {
	const {map, objects} = createMap();
	let matchesLength;
	reaction(() => map.getBy({ prop1: 'value1' }), (data) => { 
		matchesLength = data.length;
	});
	map.add({ prop1: 'value1', prop2: 'completelyNew' });
	t.equals(matchesLength, 3);
	// Add non-match
	map.add({ prop2: 'value1' });
	t.equals(matchesLength, 3);
	t.end();
});


/*test('returns original values', (t) => {
	const {map, objects} = createMap();
	t.deepEqual(map.originalValues.slice(0), objects);
	t.end();
});*/

