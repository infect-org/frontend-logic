import test from 'tape';
import notificationSeverityLevels from './notificationSeverityLevels.js';

test('exports expected notification severity levels', (t) => {
    t.is(['error', 'warning', 'information']
        .every(level => Object.keys(notificationSeverityLevels).includes(level)), true);
    t.end();
});
