import test from 'tape';
import getRelativeValue from './getRelativeValue';

test('throws on invalid arguments', (t) => {
	t.throws(() => getRelativeValue(5, 4, 4), /smaller than/);
	t.throws(() => getRelativeValue(3, 4, 4), /larger than/);
	t.end();
});

test('returns correct values', (t) => {
	t.equal(getRelativeValue(2, 0, 4), 0.5);
	t.equal(getRelativeValue(2, 0, 4, 0.5), 0.75);
	t.equal(getRelativeValue(4, 0, 4, 0.5), 1);
	t.equal(getRelativeValue(4, 3, 4, 0.5), 1);
	t.equal(getRelativeValue(1, 1, 1, 0.5), 1);
	t.end();
});