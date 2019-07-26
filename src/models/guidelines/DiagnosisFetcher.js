import debug from 'debug';
import Fetcher from '../../helpers/standardFetcher.js';
import Diagnosis from './Diagnosis.js';

const log = debug('infect:DiagnosisFetcher');

export default class DiagnosisFetcher extends Fetcher {
    handleData(data) {

        const [
            diagnosisClasses,
            diagnosesBacteria,
            bacteria,
            therapiesStore,
        ] = this.dependentStores;

        data.forEach((diagnosis) => {

            log('Create model for diagnosis %o', diagnosis);

            // Get inducing bacteria; mappings are in store for diagnosis_bacterium.
            const inducingBacteria = diagnosesBacteria
                .getAsArray()
                .filter(mapping => mapping.id_diagnosis === diagnosis.id)
                .map(mapping => bacteria.getById(mapping.id_bacterium));

            const therapies = therapiesStore
                .getAsArray()
                .filter(therapy => therapy.diagnosisId === diagnosis.id);
            therapies.forEach(therapy => therapy.removeDiagnosisId());

            log('Inducing bacteria are %o, therapies are %o', inducingBacteria, therapies);

            const diagnosisModel = new Diagnosis(
                diagnosis.id,
                diagnosis.name,
                diagnosisClasses.getById(diagnosis.id_diagnosisClass),
                inducingBacteria,
                diagnosis.markdownText,
                therapies,
            );
            /**
             * Temporarily store guideline ID on diagnosis; will be needed to resolve matching
             * diagnoses when we create the guidelines (see GuidelineFetcher)
             */
            diagnosisModel.setGuidelineId(diagnosis.id_guideline);

            this.store.add(diagnosisModel);

        });
    }
}
