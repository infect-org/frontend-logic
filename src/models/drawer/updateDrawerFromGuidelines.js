import { reaction } from 'mobx';
import debug from 'debug';

const log = debug('infect:updateDrawerFromGuidelines');

/**
 * Drawer should not know about guidelines and guidelines should not know about the drawer.
 * Therefore we introduce a pseudo-mediator that knows both and handles communication between them
 * (updates drawer's content whenever a guideline's diagnosis is selected).
 * If more drawer content is added, additional update functions may be implemented to set drawer's
 * content.
 */
export default function updateDrawerFromGuidelines(guidelineStore, drawer, errorHandler) {
    reaction(
        () => (
            // We only need to update the drawer when the diagnosis has changed (not the guideline),
            // as guideline does not contain any relevant information for the drawer
            guidelineStore.selectedGuideline && guidelineStore.selectedGuideline.selectedDiagnosis
        ),
        (diagnosis) => {
            log('Selected diagnosis changed to %o', diagnosis);
            // Reaction happens outside of main JS loop; possible errors must be handled here
            try {
            // Only set drawer's content if diagnosis was selected
                if (diagnosis) drawer.setContent(guidelineStore.selectedGuideline);
                else drawer.setContent(undefined);
            } catch (err) {
                errorHandler.handle(err);
            }
        },
    );
}
