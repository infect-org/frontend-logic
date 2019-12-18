import test from 'tape';
import Store from './Store.js';


test('has a state', (t) => {
    const store = new Store();
    t.is(store.status !== undefined, true);
    t.end();
});

test('stores on init', (t) => {
    const values = [{ id: 1 }, { id: 2 }];
    const store = new Store(values);
    t.equal(store.get().size, 2);
    t.end();
});

test('returns values', (t) => {
    const store = new Store([{ id: 1 }, { id: 2 }]);
    t.equal(store.get().size, 2);
    t.equal(store.getAsArray().length, 2);
    t.end();
});

test('throws if id is missing', (t) => {
    t.throws(() => new Store([{ id: 1 }, { a: 2 }]), /"a":2/);
    t.end();
});

test('adds items', (t) => {
    const store = new Store([{ id: 1 }, { id: 2 }]);
    store.add({ id: 3 });
    t.equals(store.get().size, 3);
    t.end();
});

test('does not overwrite items', (t) => {
    const store = new Store([{ id: 1 }, { id: 2 }]);
    t.throws(() => store.add({ id: 2 }));
    t.doesNotThrow(() => store.add({ id: 2 }, true));
    t.equals(store.get().size, 2);
    t.end();
});

test('hasWithId works as expected', (t) => {
    const store = new Store([{ id: 1 }, { id: 2 }], item => item.id);
    t.equals(store.hasWithId({ id: 1, otherProp: 4 }), true);
    t.equals(store.hasWithId({ id: 4, otherProp: 1 }), false);
    t.end();
});

test('calculates correct item id', (t) => {
    const store = new Store([], item => item.ide);
    t.equals(store._getItemId({ ide: 1 }), 1);
    const noItemStore = new Store([]);
    t.equals(noItemStore._getItemId({ id: 1 }), 1);
    t.end();
});


test('uses idGeneratorFunction if provided', (t) => {
    const store = new Store([], item => `${item.idA}/${item.idB}`);
    t.doesNotThrow(() => store.add({ idA: 3, idB: 3 }));
    // Duplicate entry
    t.throws(() => store.add({ idA: 3, idB: 3 }));
    store.add({ idA: 3, idB: 4 });
    t.equals(store.getById('3/3') !== undefined, true);
    t.equals(store.getAsArray().length, 2);
    t.end();
});

test('clears items', (t) => {
    const store = new Store();
    store.add({ id: 1, value: 'test1' });
    store.add({ id: 2, value: 'test2' });
    store.clear();
    t.equals(store.get().size, 0);
    t.end();
});

test('removes item', (t) => {
    const store = new Store([{ id: 1 }, { id: 3 }]);
    store.remove({ id: 1, value: 7 });
    t.equals(store.getAsArray().length, 1);
    t.equals(store.getById(1), undefined);
    t.end();
});

