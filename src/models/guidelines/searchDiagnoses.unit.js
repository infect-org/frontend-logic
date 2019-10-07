import test from 'tape';
import searchDiagnoses from './searchDiagnoses.js';

function setupData() {
    const data = [{
        name: 'guideline1',
        diagnoses: [{
            name: 'diagnosis1-1',
            synonyms: [],
        }, {
            name: 'diagnosis1-2',
            synonyms: ['syn1', 'syn2'],
        }],
    }, {
        name: 'guideline2',
        diagnoses: [{
            name: 'diagnosis2-1',
            synonyms: [],
        }],
    }];

    return { data };

}


test('returns expected search results for name match', (t) => {
    const { data } = setupData();
    const results = searchDiagnoses(data, 'diagnosis');
    // Filters synonyms for diagnois 1, only returns main entry (without synonyms)
    t.is(results.length, 3);
    t.is(results[0].name, 'diagnosis1-1');
    t.is(results[0].synonym, '');
    t.is(results[1].name, 'diagnosis1-2');
    t.is(results[1].synonym, '');
    t.is(results[2].name, 'diagnosis2-1');
    t.is(results[2].synonym, '');
    t.end();
});

test('returns empty set if no term was used', (t) => {
    const { data } = setupData();
    const results = searchDiagnoses(data, '');
    t.deepEqual(results, []);
    t.end();
});

test('returns expected search results for synonym match', (t) => {
    const { data } = setupData();
    const results = searchDiagnoses(data, 'syn1');
    // Filters synonyms for diagnois 1, only returns main entry (without synonyms)
    t.is(results.length, 1);
    t.is(results[0].name, 'diagnosis1-2');
    t.is(results[0].synonym, 'syn1');
    t.end();
});

