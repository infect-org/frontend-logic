import test from 'tape';
import Guideline from './Guideline.js';

test('constructor validates arguments', (t) => {
    t.throws(() => new Guideline(), /number/);
    t.throws(() => new Guideline({ id: 'NotANumber' }), /number/);
    t.throws(() => new Guideline({ id: 5, name: 2 }), /string/);
    t.end();
});

test('sets properties from constructor', (t) => {
    const guideline = new Guideline({
        id: 5,
        name: 'name',
        diagnoses: ['diagnosis'],
        markdownDisclaimer: 'Careful!',
        contactEmail: 'guidelines@infect.info',
    });
    t.is(guideline.id, 5);
    t.is(guideline.name, 'name');
    t.is(guideline.contactEmail, 'guidelines@infect.info');
    t.deepEqual(guideline.diagnoses, ['diagnosis']);
    t.is(guideline.markdownDisclaimer, 'Careful!');
    t.end();
});

test('can set selected diagnosis', (t) => {
    const diagnosis = 'diagnosis';
    const guideline = new Guideline({
        id: 5,
        name: 'name',
        diagnoses: [diagnosis],
    });
    guideline.selectDiagnosis(diagnosis);
    t.is(guideline.selectedDiagnosis, diagnosis);
    guideline.selectDiagnosis();
    t.is(guideline.selectedDiagnosis, undefined);
    t.throws(() => guideline.selectDiagnosis('invalid'), /part of/);
    t.end();
});

