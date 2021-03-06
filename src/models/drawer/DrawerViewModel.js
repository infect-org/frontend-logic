import debug from 'debug';
import { observable, action, computed } from 'mobx';
import Guideline from '../guidelines/Guideline.js';
import Resistance from '../resistances/resistance.js';

const log = debug('infect:DrawerViewModel');

/**
 * Represents the drawer view (right on web, overlay on mobile). Can either be visible or not
 * and hold certain information (pharmacological data, guideline …)
 */
export default class DrawerViewModel {

    @observable isOpen = false;

    /**
     * We expose strings as selected contentType, because strings are easier to consume than our
     * internal models (see contentType() getter). This variable contains the mapping between our
     * internal models and the contentType strings.
     * @private
     */
    validContentTypes = new Map([
        [Guideline, 'guideline'],
        [Resistance, 'resistance'],
    ]);

    /**
     * Holds content to be displayed in drawer. Must be an instance of the supported content types.
     */
    @observable content;

    /**
     * Opens the drawer
     */
    @action open() {
        log('Open drawer');
        this.isOpen = true;
    }

    /**
     * Closes the drawer
     */
    @action close() {
        log('Close drawer');
        this.isOpen = false;
    }

    /**
     * Set content to be displayed in Drawer
     * @param {Guideline} content   Content to display in drawer; must be a Guideline or a
     * Resistance (for now). Set to undefined to clear content and close drawer.
     */
    @action setContent(content) {
        if (content !== undefined && !this.validContentTypes.has(content.constructor)) {
            const validClasses = Array.from(this.validContentTypes.keys())
                .map(validClass => validClass.name)
                .join(', ');
            throw new Error(`DrawerViewModel: For now, drawer only supports ${validClasses} as content, make sure you pass a corresponding instance. Instead, you passed ${JSON.stringify(content)}.`);
        }
        this.content = content;
        // Automatically open whenever content changes
        if (content === undefined) this.close();
        else this.open();
    }

    /**
     * Returns content type as a string (e.g. 'guideline' if content is a Guideline). Method is used
     * to not expose internals (Guideline class) to the outside world (to check content type via
     * instanceof).
     * @return {String|undefined}     Type of content, e.g. 'guideline' or undefined if content
     *                                is not set.
     */
    @computed get contentType() {
        if (!this.content) return undefined;
        return this.validContentTypes.get(this.content.constructor);
    }


}
