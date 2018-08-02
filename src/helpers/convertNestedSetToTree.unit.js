import test from 'tape';
import convertNestedSetToTree from './convertNestedSetToTree';

function setupData() {
	const source = [
		{ left: 1, right: 12, name: 1 },
		{ left: 2, right: 7, name: 2 },
		{ left: 3, right: 4, name: 3 },
		{ left: 4, right: 6, name: 4 },
		{ left: 8, right: 11, name: 5 },
		{ left: 9, right: 10, name: 6 },
	];
	return { source };
}

test('creates correct new array', (t) => {
	const { source } = setupData();
	const result = convertNestedSetToTree(source);
	t.deepEquals(result[0], { name: 1});
	t.deepEquals(result[1], { name: 2, parent: { name: 1 }});
	t.deepEquals(result[2], { name: 3, parent: { name: 2, parent: { name: 1 } } });
	t.deepEquals(result[3], { name: 4, parent: { name: 2, parent: { name: 1 } }});
	t.deepEquals(result[4], { name: 5, parent: { name: 1 }});
	t.deepEquals(result[5], { name: 6, parent: { name: 5, parent: { name: 1 } }});
	t.end();
});


test('creates correct new array (straight line)', (t) => {
	const source = [
		{ left: 2, right: 5, name: 2 },
		{ left: 1, right: 6, name: 1 },
		{ left: 3, right: 4, name: 3 },
	];
	const result = convertNestedSetToTree(source);
	t.deepEquals(result[0], { name: 1});
	t.deepEquals(result[1], { name: 2, parent: { name: 1 }});
	t.deepEquals(result[2], { name: 3, parent: { name: 2, parent: { name: 1 } } });
	t.end();
});