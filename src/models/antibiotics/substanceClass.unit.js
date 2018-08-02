import test from 'tape';
import SubstanceClass from './substanceClass';

test('throws if arguments are missing', (t) => {
	t.throws(() => new SubstanceClass());
	t.throws(() => new SubstanceClass(13, 'name', {}), /instance/);
	t.doesNotThrow(() => new SubstanceClass(0, ''));
	t.end();
});

test('returns parent substance classes', (t) => {
	const grandParent = new SubstanceClass(1, 'gp');
	const parent = new SubstanceClass(2, 'p', grandParent);
	const child = new SubstanceClass(3, 'ch', parent);
	t.equal(child.getParentSubstanceClasses().length, 2);
	t.equal(child.getParentSubstanceClasses()[0], parent);
	t.equal(child.getParentSubstanceClasses()[1], grandParent);
	t.end();
});

test('does not set parent if it\'s not provided', (t) => {
	t.equal(new SubstanceClass(1, 'name').hasOwnProperty('parent'), false);
	t.end();
});

test('stores additional properties', (t) => {
	const sc = new SubstanceClass(1, 'name', undefined, { prop1: 'red', prop2: 3 });
	t.equals(sc.prop1, 'red');
	t.equals(sc.prop2, 3);
	t.end();
});

test('throws on invalid colors', (t) => {
	t.throws(() => new SubstanceClass(1, 'name', undefined, { color: 12 }), /be a string/);
	t.throws(() => new SubstanceClass(1, 'name', undefined, { color: '2/1' }), /three parts/);
	t.throws(() => new SubstanceClass(1, 'name', undefined, { color: 'test/2/3' }), /not a number/);
	t.throws(() => new SubstanceClass(1, 'name', undefined, { color: '-1/366/51' }), /between 0 and 255/);
	t.end();
});

test('recognizes and re-formats colors', (t) => {
	const sc = new SubstanceClass(1, 'name', undefined, { color: '100/150/200' });
	t.deepEquals(sc.color, {
		r: 100
		, g: 150
		, b: 200
	});
	t.end();
});

test('sets and reads used', (t) => {
	const sc = new SubstanceClass(1, 'name');
	t.equals(sc.used, false);
	sc.setUsed(true);
	t.equals(sc.used, true);
	t.end();
});