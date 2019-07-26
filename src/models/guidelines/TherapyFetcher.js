import debug from 'debug';
import Fetcher from '../../helpers/standardFetcher.js';
import Therapy from './Therapy.js';

const log = debug('infect:TherapyFetcher');

export default class TherapyFetcher extends Fetcher {
    handleData(data) {
        data.forEach((therapy) => {

            log('Create model for therapy %o', therapy);

            const [
                therapyPriorityStore,
                therapyCompoundsStore,
                antibioticsStore,
            ] = this.dependentStores;

            // Get matching therapy priority from corresponding store
            const therapyPriority = therapyPriorityStore.getById(therapy.id_therapyPriority);

            // Map antibiotics to therapy through mapping table in therapyCompoundsStore
            const recommendedAntibiotics = therapyCompoundsStore
                .getAsArray()
                .filter(mapping => mapping.id_therapy === therapy.id)
                .map(mapping => ({
                    antibiotic: antibioticsStore.getById(mapping.id_compound),
                    markdownText: mapping.markdownText,
                }));

            log(
                'Priority is %o, recommended antibiotics are %o',
                therapyPriority,
                recommendedAntibiotics,
            );

            const therapyModel = new Therapy(
                therapy.id,
                recommendedAntibiotics,
                therapyPriority.priority,
                therapyPriority.name,
                therapy.markdownText,
            );

            therapyModel.setDiagnosisId(therapy.id_diagnosis);

            this.store.add(therapyModel);

        });
    }
}
