import { fetchApi } from '../../helpers/api.js';

/**
 * Fetches MIC data from server (MIC data is not returned by RDA on initial load due to the heavy
 * computational its calculation causes)
 */
export default async(resistance, resistanceValue, getURL, filterHeader) => {

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
    const filters = {
        ...filterHeader,
        compoundSubstanceIds: [resistance.antibiotic.id],
        microorganismIds: [resistance.bacterium.id],
    };
    const url = `${getURL('rda', 'data')}?subRoutines=["${subroutines[resistanceValue.type.identifier]}"]&filter=${JSON.stringify(filters)}`;
    const result = await fetchApi(url, options);

    // Invalid HTTP Status
    if (result.status !== 200) {
        throw new Error(`fetchQuantitativeData: Status ${result.status} is invalid.`);
    }

    const dataKeys = {
        mic: 'MICPercentile90',
        discDiffusion: 'discDiffusionPercentile90',
    };
    const dataKey = dataKeys[resistanceValue.type.identifier];

    if (!result.data ||
        !result.data.values ||
        result.data.values.length !== 1 ||
        !result.data.values[0] ||
        !result.data.values[0][dataKey]
    ) {
        throw new Error(`fetchQuantitativeData: Expected response to have data.values[0].${dataKey}, is ${JSON.stringify(result)} instead.`);
    }

    const returnValue = result.data.values[0][dataKey];
    return returnValue;

};
