import Fetcher from '../../helpers/standardFetcher';
import Bacterium from './bacterium';

export default class BacteriaFetcher extends Fetcher {

    handleData(data) {
        data.forEach((item) => {
            const options = {
                // Use two properties for aerobic/anaerobic, as selecting both
                // should only display values that validate for *both* properties:
                // https://github.com/infect-org/frontend/issues/71
                aerobic: item.aerobic || item.aerobicOptional,
                anaerobic: item.anaerobic || item.anaerobicOptional,
                shape: item.shape ? item.shape.name : undefined,
                gram: item.gramPositive,
                shortName: item.shortName,
            };
            const bact = new Bacterium(item.id, item.name, options);
            this.store.add(bact);
        });
    }

}
