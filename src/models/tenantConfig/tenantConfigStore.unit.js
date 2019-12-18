import test from 'tape';
import TenantConfigStore from './TenantConfigStore.js';

test('handles invalid flags', (t) => {
    const store = new TenantConfigStore();
    t.throws(() => store.setData(), /but got undefined/);
    t.throws(() => store.setData('notAnObject'), /but got "notAnObject"/);
    t.end();
});

test('handles invalid flags', (t) => {
    const store = new TenantConfigStore();
    t.throws(() => store.setData({ featureFlags: 'test' }), /must be an array, is "test"/);
    t.throws(() => store.setData({ featureFlags: [{}] }), /but got \{\}/);
    t.end();
});

test('returns flags', (t) => {
    const store = new TenantConfigStore();
    const flags = [
        { identifier: 'guidelines', enabled: true },
        { identifier: 'rda', enabled: false },
    ];
    store.setData({ featureFlags: flags });
    t.is(store.hasFeature('guidelines'), true);
    t.is(store.hasFeature('rda'), false);
    t.is(store.hasFeature('unknown'), false);
    t.end();
});

test('handles invalid configuration', (t) => {
    const store = new TenantConfigStore();
    t.throws(() => store.setData({ configuration: 'test' }), /to be an array, but is "test"/);
    t.throws(() => store.setData({ configuration: [{}] }), /you passed \{\} instead/);
    t.end();
});

test('returns config', (t) => {
    const store = new TenantConfigStore();
    const config = [{
        identifier: 'rda',
        config: { test: true },
    }];
    store.setData({ configuration: config });
    t.deepEqual(store.getConfig('rda'), { test: true });
    t.is(store.getConfig('test'), undefined);
    t.end();
});
