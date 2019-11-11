import test from 'tape';
import wrapNotification from './wrapNotification.js';

test('reformats error', (t) => {
    const error = new Error('testError');
    t.deepEqual(
        wrapNotification(error),
        {
            error,
            message: error.stack,
            severity: 'error',
        },
    );
    t.end();
});

test('converts to error on invalid data', (t) => {
    const noNotification = wrapNotification();
    t.is(noNotification.error instanceof Error, true);
    t.is(noNotification.severity, 'error');
    t.is(noNotification.message.includes('Pass an Error or a notification'), true);

    const noSeverity = wrapNotification({ noSeverity: true });
    t.is(noSeverity.error instanceof Error, true);
    t.is(noSeverity.severity, 'error');
    t.is(noSeverity.message.includes('must include a property "severity"'), true);

    const invalidSeverity = wrapNotification({ noSeverity: true });
    t.is(invalidSeverity.error instanceof Error, true);
    t.is(invalidSeverity.severity, 'error');
    t.is(invalidSeverity.message.includes('must include a property "severity"'), true);

    const noMessage = wrapNotification({ severity: 'error' }, ['error']);
    t.is(noMessage.error instanceof Error, true);
    t.is(noMessage.severity, 'error');
    t.is(noMessage.message.includes('must include a property "message"'), true);

    t.end();
});

test('returns valid notification', (t) => {
    const notification = wrapNotification({
        message: 'test',
        severity: 'warning',
        additionalField: true,
    }, ['warning']);
    t.deepEqual(notification, {
        message: 'test',
        severity: 'warning',
    });
    t.end();
});
