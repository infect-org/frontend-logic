import debug from 'debug';
import { observable, action, computed } from 'mobx';
import Guideline from '../guidelines/Guideline.js';

const log = debug('infect:DrawerViewModel');

/**
 * Represents the drawer view (right on web, overlay on mobile). Can either be visible or not
 * and hold certain information (pharmacological data, guideline …)
 */
export default class DrawerViewModel {

    @observable isOpen = false;

    /**
     * Holds content to be displayed in drawer. Must be an instance of the supported content types.
     */
    @observable content;

    @action open() {
        log('Open drawer');
        this.isOpen = true;
    }

    @action close() {
        log('Close drawer');
        this.isOpen = false;
    }

    /**
     * Set content to be displayed in Drawer
     * @param {Diagnosis} content   Content to display in drawer; must be a Guideline (for now).
     */
    @action setContent(content) {
        if (content !== undefined && !(content instanceof Guideline)) {
            throw new Error(`DrawerViewModel: For now, drawer only supports Guideline as content, make sure you pass a corresponding instance. Instead, you passed ${JSON.stringify(content)}.`);
        }
        this.content = content;
        // Automatically open whenever content changes
        if (content === undefined) this.close();
        // else this.open(); This sucks heavily, don't do it.
    }

    /**
     * Returns content type as a string (e.g. 'guideline' if content is a Guideline). Method is used
     * to not expose internals (Guideline class) to the outside world (to check content type via
     * instanceof).
     * @return {String}     Type of content, e.g. 'guideline'
     */
    @computed get contentType() {
        if (this.content instanceof Guideline) return 'guideline';
        return undefined;
    }


}
