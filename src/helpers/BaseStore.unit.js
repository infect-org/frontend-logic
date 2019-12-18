import { observe } from 'mobx';
import test from 'tape';
import storeStatus from './storeStatus.js';
import BaseStore from './BaseStore.js';


test('returns default status', (t) => {
    const store = new BaseStore();
    t.equals(store.status.identifier, storeStatus.initialized);
    t.end();
});

test('throws when setting invalid fetchPromises', (t) => {
    const store = new BaseStore();
    t.throws(() => store.setFetchPromise(null), /Promise/);
    t.end();
});

test('setting fetchPromise updates status and promise', (t) => {
    const store = new BaseStore();
    t.equals(store.status.identifier, storeStatus.initialized);
    const promise = new Promise((resolve) => {
        setTimeout(resolve, 50);
    });
    store.setFetchPromise(promise);
    t.equals(store.status.identifier, storeStatus.loading);

    promise.then(() => {
        t.equals(store.status.identifier, storeStatus.ready);
        t.end();
    });

});

test('sets status to error on errors', (t) => {
    const store = new BaseStore();
    const error = new Error('fetchError');
    const promise = new Promise((resolve, reject) => {
        setTimeout(() => { reject(error); }, 50);
    });
    store.setFetchPromise(promise);

    // Promise will still fail, even if added to status.error – make sure we don't have an
    // unhandled error
    promise.catch(() => {
        t.equals(store.status.identifier, storeStatus.error);
        t.is(store.status.error, error);
        t.end();
    });
});



