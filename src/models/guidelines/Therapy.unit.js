import test from 'tape';
import Therapy from './Therapy';

test('constructor validates arguments', (t) => {
    t.throws(() => new Therapy('NotANumber'), /id/);
    t.throws(() => new Therapy(3, [], 'NotANumber'), /priority/);
    t.throws(() => new Therapy(3, [], 1, 2), /priorityName/);
    t.end();
});

test('sets properties from constructor', (t) => {
    const therapy = new Therapy(5, ['antibiotics'], 2, 'prioName');
    t.is(therapy.id, 5);
    t.deepEqual(therapy.recommendedAntibiotics, ['antibiotics']);
    t.is(therapy.priority.order, 2);
    t.is(therapy.priority.name, 'prioName');
    t.end();
});

test('containsAntibiotic returns expected result', (t) => {
    const antibiotics = [{
        antibiotic: 'ab1', markdownText: '',
    }, {
        antibiotic: 'ab2', markdownText: '',
    }];
    const therapy = new Therapy(5, antibiotics, 2, 'prioName');
    t.is(therapy.containsAntibiotic('ab1'), true);
    t.is(therapy.containsAntibiotic('ab0'), false);
    t.end();
});
