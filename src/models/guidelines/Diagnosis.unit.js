import test from 'tape';
import Diagnosis from './Diagnosis';

test('constructor validates arguments', (t) => {
    t.throws(() => new Diagnosis(), /id/);
    t.throws(() => new Diagnosis({ id: 'NotANumber' }), /id/);
    t.throws(() => new Diagnosis({ id: 5, name: 3 }), /name/);
    t.throws(() => new Diagnosis({ id: 5, name: 'name', markdownText: 3 }), /markdownText/);
    t.throws(() => new Diagnosis({
        id: 5,
        name: 'name',
        markdownText: 'text',
        synonyms: 'text',
    }), /synonyms/);
    t.throws(() => new Diagnosis({
        id: 5,
        name: 'name',
        markdownText: 'text',
        synonyms: ['text', 6],
    }), /synonyms/);
    t.end();
});

test('sets properties from constructor', (t) => {
    const diagnosis = new Diagnosis({
        id: 5,
        name: 'name',
        diagnosisClass: 'fakeClass',
        inducingBacteria: ['inducing'],
        markdownText: 'markdownText',
        therapies: ['therapies'],
        link: 'http://guidelines.ch/diag1',
        synonyms: ['syn1'],
        latestUpdate: {
            date: new Date(2019, 0, 1),
            name: 'guidelines',
            link: 'http://guidelines.ch',
        },
    });
    t.is(diagnosis.id, 5);
    t.is(diagnosis.name, 'name');
    t.is(diagnosis.diagnosisClass, 'fakeClass');
    t.deepEqual(diagnosis.inducingBacteria, ['inducing']);
    t.is(diagnosis.markdownText, 'markdownText');
    t.deepEqual(diagnosis.therapies, ['therapies']);
    t.deepEqual(diagnosis.synonyms, ['syn1']);
    t.is(diagnosis.link, 'http://guidelines.ch/diag1');
    t.deepEqual(diagnosis.latestUpdate, {
        date: new Date(2019, 0, 1),
        name: 'guidelines',
        link: 'http://guidelines.ch',
    });
    t.end();
});

test('sets and removes guidelineId', (t) => {
    const diagnosis = new Diagnosis({
        id: 5,
        name: 'name',
        diagnosisClass: 'fakeClass',
        inducingBacteria: ['inducing'],
        markdownText: 'markdownText',
        therapies: ['therapies'],
    });
    diagnosis.setGuidelineId(5);
    t.is(diagnosis.guidelineId, 5);
    diagnosis.removeGuidelineId();
    t.is(Object.prototype.hasOwnProperty.call(diagnosis, 'guidelineId'), false);
    t.end();
});
