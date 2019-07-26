import Fetcher from '../../helpers/standardFetcher.js';
import DiagnosisClass from './DiagnosisClass.js';

export default class DiagnosisClassFetcher extends Fetcher {
    handleData(data) {
        data.forEach((diagnosisClass) => {
            this.store.add(new DiagnosisClass(
                diagnosisClass.id,
                diagnosisClass.name,
            ));
        });
    }
}
