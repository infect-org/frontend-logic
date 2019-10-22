import test from 'tape';
import { observable, action } from 'mobx';
import updateDrawerFromGuidelines from './updateDrawerFromGuidelines.js';

function setupData() {
    class GuidelineStore {
        @observable selectedGuideline;
        @action setSelectedGuideline(guideline) {
            this.selectedGuideline = guideline;
        }
    }
    class Guideline {
        @observable selectedDiagnosis;
        @action setSelectedDiagnosis(diagnosis) {
            this.selectedDiagnosis = diagnosis;
        }
    }
    class Drawer {
        setContent(content) {
            this.content = content;
        }
    }
    class ErrorHandler {
        handle(err) {
            this.error = err;
        }
    }
    return [GuidelineStore, Guideline, Drawer, ErrorHandler];
}

test('updates on change', (t) => {

    const [GuidelineStore, Guideline, Drawer] = setupData();
    const guidelineStore = new GuidelineStore();
    const guideline = new Guideline();
    const drawer = new Drawer();
    const diagnosis1 = 'diagnosis1';

    updateDrawerFromGuidelines(guidelineStore, drawer);

    t.is(drawer.content, undefined);

    // Set guideline
    guidelineStore.setSelectedGuideline(guideline);
    t.is(drawer.content, undefined);

    // Set diagnosis
    guideline.setSelectedDiagnosis(diagnosis1);
    t.is(drawer.content, guideline);

    // Remove diagnosis: There's no real content to be displayed in drawer, content should be
    // undefined
    guideline.setSelectedDiagnosis();
    t.is(drawer.content, undefined);

    // Re-setet diagnosis, remove guideline: There's no content to display, content should be
    // undefined
    guideline.setSelectedDiagnosis(diagnosis1);
    t.is(drawer.content, guideline);
    guidelineStore.setSelectedGuideline();
    t.is(drawer.content, undefined);

    t.end();
});

test('handles errors', (t) => {
    const [GuidelineStore, Guideline, , ErrorHandler] = setupData();
    const guidelineStore = new GuidelineStore();
    const guideline = new Guideline();
    const drawerError = new Error('DrawerError');
    const errorHandler = new ErrorHandler();
    const drawer = {
        setContent() { throw drawerError; },
    };

    updateDrawerFromGuidelines(guidelineStore, drawer, errorHandler);

    guidelineStore.setSelectedGuideline(guideline);
    guideline.setSelectedDiagnosis('test');

    t.is(errorHandler.error, drawerError);
    t.end();
});

