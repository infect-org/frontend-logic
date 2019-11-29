import test from 'tape';
import * as infect from './index.js';


test('exports non-defaults', (t) => {
    const expectations = {
        filterTypes: 'object',
        resistanceTypes: 'object',
        models: 'object',
        storeStatus: 'object',
        severityLevels: 'object',
    };

    Object.keys(expectations).forEach((key) => {
        t.is(typeof infect[key], expectations[key]);
    });
    t.end();
});
