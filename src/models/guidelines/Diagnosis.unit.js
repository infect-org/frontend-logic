import test from 'tape';
import Diagnosis from './Diagnosis';

test('constructor validates arguments', (t) => {
    t.throws(() => new Diagnosis('NotANumber'), /id/);
    t.throws(() => new Diagnosis(5, 3), /name/);
    t.throws(() => new Diagnosis(5, 'name', undefined, undefined, 3), /markdownText/);
    t.end();
});

test('sets properties from constructor', (t) => {
    const diagnosis = new Diagnosis(5, 'name', 'fakeClass', ['inducing'], 'markdownText', ['therapies']);
    t.is(diagnosis.id, 5);
    t.is(diagnosis.name, 'name');
    t.is(diagnosis.diagnosisClass, 'fakeClass');
    t.deepEqual(diagnosis.inducingBacteria, ['inducing']);
    t.is(diagnosis.markdownText, 'markdownText');
    t.deepEqual(diagnosis.therapies, ['therapies']);
    t.end();
});
