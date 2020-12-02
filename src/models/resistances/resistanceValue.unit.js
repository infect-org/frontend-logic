import test from 'tape';
import ResistanceValue from './resistanceValue';
import resistanceTypes from './resistanceTypes';

test('throws on invalid values', (t) => {
	t.throws(() => new ResistanceValue(), /not known/);
	t.throws(() => new ResistanceValue('invalid'), /not known/);
	t.throws(() => new ResistanceValue('qualitative', -1), /between/);
	t.throws(() => new ResistanceValue('qualitative', 1.3), /between/);
	t.throws(() => new ResistanceValue('qualitative', 'text', /number/));
	t.throws(() => new ResistanceValue('qualitative', 1, 1.5, /integer/));
	t.throws(() => new ResistanceValue('qualitative', 1, 'text', /integer/));	
	t.end();
});

test('stores type and value correctly', (t) => {
	const resVal = new ResistanceValue('qualitative', '0.9', 5);
	t.equal(resVal.value, 0.9);
	t.equal(resVal.sampleSize, 5);
	t.equal(resVal.type, resistanceTypes.qualitative);
	t.end();
});

test('confidence interval', (t) => {
	t.throws(() => new ResistanceValue('qualitative', 0.9, 5, 'bad'), /array/);
	t.throws(() => new ResistanceValue('qualitative', 0.9, 5, [1, 2, 3]), /two items/);
	t.throws(() => new ResistanceValue('qualitative', 0.9, 5, [1, false]), /numbers/);
	t.throws(() => new ResistanceValue('qualitative', 0.9, 5, [1, 1.1]), /between 0 and 1/);
	t.throws(() => new ResistanceValue('qualitative', 0.9, 5, [-1, 0.9]), /between 0 and 1/);
	t.throws(() => new ResistanceValue('qualitative', 0.9, 5, [0.8, 0.5]), /smaller than/);
	t.throws(() => new ResistanceValue('qualitative', 0.3, 5, [0.4, 0.5]), /embrace/);
	const valid = new ResistanceValue('qualitative', 0.9, 5, [0.1, 0.9]);
	t.equals(valid.confidenceInterval[0], 0.1);
	t.equals(valid.confidenceInterval[1], 0.9);
	t.end();
});