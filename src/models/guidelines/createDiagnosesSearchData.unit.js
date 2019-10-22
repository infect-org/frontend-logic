import test from 'tape';
import createDiagnosesSearchData from './createDiagnosesSearchData.js';

test('creates expected strucgture', (t) => {

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

    const result = createDiagnosesSearchData(data);

    t.deepEqual(result, [{
        name: 'diagnosis1-1',
        synonym: '',
        diagnosis: data[0].diagnoses[0],
        guideline: data[0],
    }, {
        name: 'diagnosis1-2',
        synonym: '',
        diagnosis: data[0].diagnoses[1],
        guideline: data[0],
    }, {
        name: 'diagnosis1-2',
        synonym: 'syn1',
        diagnosis: data[0].diagnoses[1],
        guideline: data[0],
    }, {
        name: 'diagnosis1-2',
        synonym: 'syn2',
        diagnosis: data[0].diagnoses[1],
        guideline: data[0],
    }, {
        name: 'diagnosis2-1',
        synonym: '',
        diagnosis: data[1].diagnoses[0],
        guideline: data[1],
    }]);

    t.end();

});
