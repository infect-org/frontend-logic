import test from 'tape';
import rdaCounterTypes from './rdaCounterTypes.js';

test('rdaCounterTypes returns all expected types', (t) => {
    const types = ['bacterium', 'antibiotic', 'ageGroup', 'region'];
    t.is(types.every(type => rdaCounterTypes[type] !== undefined), true);
    t.end();
});
