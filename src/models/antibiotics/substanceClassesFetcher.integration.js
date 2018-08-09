import test from 'tape';
import fetchMock from 'fetch-mock';
import SubstanceClassesFetcher from './substanceClassesFetcher';
import SubstanceClassesStore from './substanceClassesStore';



test('handles substanceClass data correctly', (t) => {
    fetchMock.mock(
        '/test',
        {
            status: 200,
            body: [{
                id: 1,
                name: 'test1',
                parent: null,
                color: '114/5/2',
                order: 3,
            }],
        },
    );
    const store = new SubstanceClassesStore();
    const scf = new SubstanceClassesFetcher('/test', store);
    scf.getData();
    setTimeout(() => {

        // Store adds virtual substance class «Beta-lactam + inhibitor» by itself
        t.equals(store.get().size, 2);
        t.equals(store.getById(1).name, 'test1');

        t.equals(store.getById(-1).name, 'Beta-lactam + inhibitor');
        t.deepEquals(store.getById(1).color, { r: 114, g: 5, b: 2 });
        fetchMock.restore();
        t.end();
    });
});

test('creates hierarchy', (t) => {
    fetchMock.mock(
        '/test',
        {
            status: 200,
            body: [{
                id: 1,
                name: 'test1',
                left: 3,
                right: 4,
            }, {
                id: 3,
                name: 'test1',
                left: 2,
                right: 5,
            }, {
                id: 2,
                name: 'test1',
                left: 1,
                right: 6,
            }],
        },
    );
    const store = new SubstanceClassesStore();
    const scf = new SubstanceClassesFetcher('/test', store);
    scf.getData();
    setTimeout(() => {
        t.equals(store.get().size, 4);
        t.equals(store.getById(1).getParentSubstanceClasses().length, 2);
        fetchMock.restore();
        t.end();
    });
});

