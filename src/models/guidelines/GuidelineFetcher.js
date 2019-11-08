import Fetcher from '../../helpers/standardFetcher.js';
import Guideline from './Guideline.js';

export default class GuidelineFetcher extends Fetcher {
    handleData(data) {

        const [diagnosesStore] = this.dependentStores;

        data.forEach((guideline) => {

            const diagnoses = diagnosesStore
                .getAsArray()
                .filter(diagnosis => diagnosis.guidelineId === guideline.id);

            diagnoses.forEach(diagnosis => diagnosis.removeGuidelineId);

            this.store.add(new Guideline({
                id: guideline.id,
                name: guideline.name,
                link: guideline.href,
                diagnoses,
                markdownDisclaimer: guideline.markdownDisclaimer,
                contactEmail: guideline.contactEmail,
            }));

        });

    }
}
