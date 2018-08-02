import test from 'tape';
import getArrayDiff from './getArrayDiff';

test('returns correct values', (t) => {

	const arr1 = [1, 2, 3, 4, 5];
	const arr2 = [2, 4, 5, 6];
	const diffs = getArrayDiff(arr1, arr2);
	t.deepEqual(diffs, {
		added: [6]
		, removed: [1, 3]
		, unchanged: [2, 4, 5]
	});
	t.end();

});