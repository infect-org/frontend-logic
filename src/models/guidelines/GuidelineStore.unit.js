import test from 'tape';
import GuidelineStore from './GuidelineStore.js';

/* test('initializes selectedGuideline', (t) => {
    const guidelineStore = new GuidelineStore();
    console.log(guidelineStore);
    t.is(Object.prototype.hasOwnProperty.call(guidelineStore, 'selectedGuideline'), true);
    t.end();
}); */

test('sets selectedGuideline to first guideline added', (t) => {
    const guidelineStore = new GuidelineStore();
    guidelineStore.add({ id: 0, name: 'firstGuideline' });
    t.is(guidelineStore.selectedGuideline.name, 'firstGuideline');
    guidelineStore.add({ id: 1, name: 'secondGuideline' });
    t.is(guidelineStore.selectedGuideline.name, 'firstGuideline');
    t.end();
});

test('updates selected guideline', (t) => {
    const guidelineStore = new GuidelineStore();
    const first = { id: 0, name: 'firstGuideline' };
    const second = { id: 1, name: 'secondGuideline' };
    guidelineStore.add(first);
    guidelineStore.add(second);
    guidelineStore.selectGuideline(second);
    t.is(guidelineStore.selectedGuideline.name, 'secondGuideline');
    guidelineStore.selectGuideline();
    t.is(guidelineStore.selectedGuideline, undefined);
    t.end();
});

test(
    'returns empty search result if no guidelines exist (e.g. for tenants without guidelines',
    (t) => {
        const guidelineStore = new GuidelineStore();
        t.deepEqual(guidelineStore.search('something'), []);
        t.end();
    },
);
