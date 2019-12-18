import test from 'tape';
import storeStatus from './storeStatus.js';

test('returns all types', (t) => {
    const status = ['initialized', 'loading', 'error', 'ready'];
    t.is(status.every(singularStatus => storeStatus[singularStatus] !== undefined), true);
    t.end();
});
