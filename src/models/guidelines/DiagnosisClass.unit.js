import test from 'tape';
import DiagnosisClass from './DiagnosisClass';

test('constructor validates arguments', (t) => {
    t.throws(() => new DiagnosisClass('NotANumber'), /number/);
    t.throws(() => new DiagnosisClass(5, 1), /string/);
    t.end();
});

test('sets properties from constructor', (t) => {
    const diagnosisClass = new DiagnosisClass(5, 'test');
    t.is(diagnosisClass.id, 5);
    t.is(diagnosisClass.name, 'test');
    t.end();
});
