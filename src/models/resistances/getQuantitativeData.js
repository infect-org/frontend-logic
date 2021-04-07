import resistanceTypes from './resistanceTypes.js';
import fetchQuantitativeData from './fetchQuantitativeData.js';

/**
 * Fetches MIC or discDiffusion data for a given resistance (for all values) if it's not already set
 * @param {Resistance} resistance       Resistance to fetch data for
 * @param {function} getURL             getURL function (see app)
 * @param {*} filterHeader              Headers for the currently applied population filters
 */
export default async(resistance, getURL, filterHeader) => {

    resistance.values.forEach(async(resistanceValue) => {
        const isQuantitative = [resistanceTypes.mic, resistanceTypes.discDiffusion]
            .includes(resistanceValue.type);
        const hasData = Object.keys(resistanceValue.quantitativeData).length > 0;
        if (!isQuantitative || hasData) return;

        const data = await fetchQuantitativeData(resistance, resistanceValue, getURL, filterHeader);
        resistanceValue.setQuantitativeData(data);
    });

};
