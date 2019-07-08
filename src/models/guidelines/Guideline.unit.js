import test from 'tape';
import Guideline from './Guideline';

test('constructor validates arguments', (t) => {
    t.throws(() => new Guideline('NotANumber'), /number/);
    t.throws(() => new Guideline(5, 2), /string/);
    t.end();
});

test('sets properties from constructor', (t) => {
    const guideline = new Guideline(5, 'name', ['diagnoses']);
    t.is(guideline.id, 5);
    t.is(guideline.name, 'name');
    t.deepEqual(guideline.diagnoses, ['diagnoses']);
    t.end();
});
