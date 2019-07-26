import test from 'tape';
import Guideline from './Guideline.js';

test('constructor validates arguments', (t) => {
    t.throws(() => new Guideline('NotANumber'), /number/);
    t.throws(() => new Guideline(5, 2), /string/);
    t.end();
});

test('sets properties from constructor', (t) => {
    const guideline = new Guideline(5, 'name', ['diagnoses'], 'Careful!');
    t.is(guideline.id, 5);
    t.is(guideline.name, 'name');
    t.deepEqual(guideline.diagnoses, ['diagnoses']);
    t.is(guideline.markdownDisclaimer, 'Careful!');
    t.end();
});

test('can set selected diagnosis', (t) => {
    const diagnosis = 'diagnosis';
    const guideline = new Guideline(5, 'name', [diagnosis]);
    guideline.selectDiagnosis(diagnosis);
    t.is(guideline.selectedDiagnosis, diagnosis);
    guideline.selectDiagnosis();
    t.is(guideline.selectedDiagnosis, undefined);
    t.throws(() => guideline.selectDiagnosis('invalid'), /part of/);
    t.end();
});

