import test from 'tape';
import GuidelineStore from './GuidelineStore';

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

