import debug from 'debug';
import { fetchApi } from '../../helpers/api.js';

const log = debug('infect:fetchMICData');

/**
 * Fetches MIC data from server (MIC data is not returned by RDA on initial load due to the heavy
 * computational its calculation causes)
 * TODO: Implement when API is ready
 */
export default async(resistance, resistanceValue, getURL) => {

    // For options, see StandardFetcher
    const options = {
        cache: 'no-store',
        // Requests at Insel (Edge) are rejected with status 407. This might help:
        credentials: 'include',
    };

    // URL structure: see https://github.com/infect-org/infect-frontend-logic/issues/24
    // Example: https://beta.api.infect.info/rda/v2/rda.data?subRoutines=[%22DiscDiffusionPercentile%22]&filter={%22compoundSubstanceIds%22:[1],%22microorganismIds%22:[1]}
    const subroutines = {
        mic: 'MICPercentileSubRoutine',
        discDiffusion: 'DiscDiffusionPercentile',
    };
    const url = `${getURL('rda', 'data')}?subRoutines=["${subroutines[resistanceValue.type.identifier]}"]&filter={"compoundSubstanceIds":[${resistance.antibiotic.id}],"microorganismIds":[${resistance.bacterium.id}]}`;
    // const result = await fetchApi(url, options);


    // log('Got back data %o', result);

    // // Invalid HTTP Status
    // if (result.status !== 200) {
    //     throw new Error(`fetchQuantitativeData: Status ${result.status} is invalid.`);
    // }

    // return result;


    const micData = {
        "percentile": 90,
        "percentileValue": 6.12,
        "slots": {
            "rangeMin": 0,
            "rangeMax": 53.9,
            "slotSize": 2.156,
            "slotCount": 25,
            "slots": [{
                "fromValue": 0,
                "toValue": 2.156,
                "sampleCount": Math.floor(Math.random() * 500)
            }, {
                "fromValue": 2.156,
                "toValue": 4.312,
                "sampleCount": Math.floor(Math.random() * 500)
            }, {
                "fromValue": 4.312,
                "toValue": 6.468,
                "sampleCount": Math.floor(Math.random() * 500)
            }]
        }
    }

    const ddData = {
        "percentile": 90,
        "percentileValue": 45.6,
        "slots": {
            "rangeMin": 0,
            "rangeMax": 1000,
            "slotSize": 2.156,
            "slotCount": 25,
            "slots": [{
                "fromValue": 1,
                "toValue": 2,
                "sampleCount": Math.floor(Math.random() * 500)
            }, {
                "fromValue": 2,
                "toValue": 4,
                "sampleCount": Math.floor(Math.random() * 500)
            }, {
                "fromValue": 4,
                "toValue": 8,
                "sampleCount": Math.floor(Math.random() * 500)
            }]
        }
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    return resistanceValue.type.identifier === 'mic' ? micData : ddData;

};
