import resistanceTypes from './resistanceTypes.js';
import fetchQuantitativeData from './fetchQuantitativeData.js';

/**
 * Fetches MIC or discDiffusion data for a given resistance (for all values) if it's not already set
 * @param {Resistance}
 * @param {boolean} onlyUseMostPrecise      True if only the most precise resistance value should
 *                                          be fetched; needed for activeResistance in a matrix
 *                                          (that is displayed on hover)
 */
export default async(resistance, onlyUseMostPrecise, getURL) => {

    const values = onlyUseMostPrecise ? resistance.getValuesByPrecision.slice(0, 1) :
        resistance.values;

    values.forEach(async(resistanceValue) => {
        const isQuantitative = [resistanceTypes.mic, resistanceTypes.discDiffusion]
            .includes(resistanceValue.type);
        const hasData = Object.keys(resistanceValue.quantitativeData).length > 0;
        if (!isQuantitative || hasData) return;

        const data = await fetchQuantitativeData(resistance, resistanceValue, getURL);
        resistanceValue.setQuantitativeData(data);
    });
};
