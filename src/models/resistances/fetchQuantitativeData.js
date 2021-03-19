import debug from 'debug';
import { fetchApi } from '../../helpers/api.js';

const log = debug('infect:fetchMICData');

/**
 * Fetches MIC data from server (MIC data is not returned by RDA on initial load due to the heavy
 * computational its calculation causes)
 * TODO: Implement when API is ready
 */
export default async(resistance, resistanceValue) => {

    /* const options = {
        cache: 'no-store',
        // Requests at Insel (Edge) are rejected with status 407. This might help:
        credentials: 'include',
    };
    log('Options are %o', options);

    const result = await fetchApi(url, options);
    log('Got back data %o', result);

    // Invalid HTTP Status
    if (result.status !== 200) {
        throw new Error(`StandardFetcher: Status ${result.status} is invalid.`);
    } */


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

    // console.log('got data', data);
    await new Promise(resolve => setTimeout(resolve, 100));
    return resistanceValue.type.identifier === 'mic' ? micData : ddData;

};
