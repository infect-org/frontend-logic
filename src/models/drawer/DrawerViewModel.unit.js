import test from 'tape';
import DrawerViewModel from './DrawerViewModel.js';
import Guideline from '../guidelines/Guideline.js';

test('is closed; can open and close', (t) => {
    const drawer = new DrawerViewModel();
    t.is(drawer.isOpen, false);
    drawer.open();
    t.is(drawer.isOpen, true);
    drawer.close();
    t.is(drawer.isOpen, false);
    t.end();
});

test('can update content', (t) => {
    const drawer = new DrawerViewModel();
    t.throws(() => drawer.setContent('newType'), /Guideline as content/);
    const guideline = new Guideline(5);
    drawer.setContent(guideline);
    t.is(drawer.content, guideline);
    // Check if content can be emptied
    drawer.setContent();
    t.is(drawer.content, undefined);
    t.end();
});

test('opens and closes when content changes', (t) => {
    const drawer = new DrawerViewModel();
    t.is(drawer.isOpen, false);
    const guideline = new Guideline(5);
    drawer.setContent(guideline);
    t.is(drawer.isOpen, true);
    drawer.setContent();
    t.is(drawer.isOpen, false);
    t.end();
});

test('returns correct content type', (t) => {
    const drawer = new DrawerViewModel();
    t.is(drawer.contentType, undefined);
    const guideline = new Guideline(5);
    drawer.setContent(guideline);
    t.is(drawer.contentType, 'guideline');
    t.end();
});
