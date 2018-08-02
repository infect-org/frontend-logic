import test from 'tape';
import Antibiotic from './antibiotic';
import SubstanceClass from './substanceClass';

test('throws on invalid arguments', (t) => {
	t.throws(() => new Antibiotic(), /missing/);
	t.end();
});

test('returns corret parent substanceClasses', (t) => {
	const grandParent = new SubstanceClass(1, 'grandParent');
	const parent = new SubstanceClass(2, 'parent', grandParent);
	const child = new SubstanceClass(3, 'child', parent);
	const ab = new Antibiotic(1, 'ab', child);
	t.deepEqual(ab.getSubstanceClasses(), [child, parent, grandParent]);
	t.end();
});

test('adds properties', (t) => {
	const ab = new Antibiotic('test', 1, new SubstanceClass(2, 'new'), {iv: true});
	t.equals(ab.iv, true);
	t.end();
});

test('sets used on parent substance classes', (t) => {
	const parent = new SubstanceClass(2, 'parent');
	const child = new SubstanceClass(3, 'child', parent);
	t.equals(child.used, false);
	t.equals(parent.used, false);
	const ab = new Antibiotic(1, 'ab', child);
	t.equals(child.used, true);
	t.equals(parent.used, true);
	t.end();
});