import { observable, action, makeObservable } from 'mobx';
import ResistanceValue from './resistanceValue';

export default class Resistance {

    /**
    * Values for different resistanceTypes. Only values must be observable, antibiotics and
    * bacteria are not going to change.
    */
    values = [];

    /**
    * @param {Array} values             Array of values, each an object with properties type,
    *                                   value, sampleSize
    * @param {Antibiotic} antibiotic    Antibiotic
    * @param {Bacterium} bacterium      Bacterium
    */
    constructor(values, antibiotic, bacterium) {
        makeObservable(this, {
            values: observable,
            addResistanceValue: action
        });

        if (!Array.isArray(values)) {
            throw new Error('Resistance: First argument must be an Array of resistance values');
        }
        if (!antibiotic) throw new Error('Resistance: Argument antibiotic is required.');
        if (!bacterium) throw new Error('Resistance: Argument bacterium is required.');
        values.forEach(value => this.addResistanceValue(value));
        this.antibiotic = antibiotic;
        this.bacterium = bacterium;
    }

    /**
     * Adds a value
     * @private
     */
    addResistanceValue(resistanceValue) {
        this.values.push(new ResistanceValue(
            resistanceValue.type,
            resistanceValue.value,
            resistanceValue.sampleSize,
            resistanceValue.confidenceInterval,
        ));
    }

    /**
    * Returns all resistance values, sorted by precision (see resistanceTypes)
    */
    getValuesByPrecision() {
        return this.values.slice().sort((a, b) => (a.type.precision > b.type.precision ? -1 : 1));
    }

}
