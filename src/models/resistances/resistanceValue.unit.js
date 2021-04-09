import test from 'tape';
import ResistanceValue from './resistanceValue';
import resistanceTypes from './resistanceTypes';

test('throws on invalid values', (t) => {
	t.throws(() => new ResistanceValue(), /not known/);
	t.throws(() => new ResistanceValue('invalid'), /not known/);
	t.throws(() => new ResistanceValue('qualitative', 'text'), /number; is text/);
	t.throws(() => new ResistanceValue('qualitative', 1, 1.5), /integer/);
	t.throws(() => new ResistanceValue('qualitative', 1, 'text'), /integer/);
	t.throws(
		() => new ResistanceValue('qualitative', 1, 1, [0.2, 0.3], 'notAnObject'),
		/object; you passed "notAnObject"/,
	);
	t.end();
});

test('stores type and value correctly', (t) => {
	const resVal = new ResistanceValue('qualitative', 0.9, 5);
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

test('addds additional data as properties', (t) => {
	const valid = new ResistanceValue('qualitative', 0.9, 5, [0.1, 0.9], { a: 1, b: 2 });
	t.equals(valid.a, 1);
	t.equals(valid.b, 2);
	t.end();
});

test('sets MIC data', (t) => {
	const value = new ResistanceValue('mic', undefined, 5);
	const data = {
		"percentile": 90,
		"percentileValue": 45.6,
		"rangeMin": 0,
		"rangeMax": 53.9,
		"slotCount": 25,
		"slots": [{
			"fromValue": 0,
			"toValue": 2.156,
			"sampleCount": 0
		}, {
			"fromValue": 2.156,
			"toValue": 4.312,
			"sampleCount": 0
		}, {
			"fromValue": 4.312,
			"toValue": 6.468,
			"sampleCount": 0
		}]
	}
	value.setQuantitativeData(data);
	// We cannot compare both objects, MobX fails with mic.slots.slots. Cannot convert it to regular
	// JS object either (https://mobx.js.org/observable-state.html)
	t.deepEqual(value.quantitativeData.percentile, 90);
	t.end();
});

test('validates mic data when trying to set it', (t) => {
	const value = new ResistanceValue('mic', undefined, 5);
	t.throws(() => value.setQuantitativeData(), /expected base format/);
	t.end();
});

