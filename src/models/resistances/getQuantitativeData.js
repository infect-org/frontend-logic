import resistanceTypes from './resistanceTypes.js';
import fetchQuantitativeData from './fetchQuantitativeData.js';

/**
 * Fetches MIC or discDiffusion data for a given resistance (for all values) if it's not already set
 */
export default async(resistance) => {
    resistance.values.forEach(async(resistanceValue) => {
        const isQuantitative = [resistanceTypes.mic, resistanceTypes.discDiffusion]
            .includes(resistanceValue.type);
        const hasData = Object.keys(resistanceValue.quantitativeData).length > 0;
        if (!isQuantitative || hasData) return;

        const data = await fetchQuantitativeData(resistance, resistanceValue);
        resistanceValue.setQuantitativeData(data);
    });
};
