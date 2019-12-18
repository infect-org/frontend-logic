import debug from 'debug';
import Fetcher from '../../helpers/standardFetcher';
import Bacterium from './bacterium';
import rdaCounterTypes from '../rdaCounter/rdaCounterTypes.js';

const log = debug('infect:BacteriaFetcher');

export default class BacteriaFetcher extends Fetcher {

    constructor(options) {
        super(options);
        const { dependentStores } = options;
        // Make rdaCounter optional for easiert testing
        if (dependentStores) [this.rdaCounter] = dependentStores;
    }

    handleData(data) {
        data.forEach((item) => {

            if (this.rdaCounter) {
                if (!this.rdaCounter.hasItem(rdaCounterTypes.bacterium, item.id)) {
                    log('Bacterium %o has not RDA data, remove');
                    return;
                }
            }

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
