/**
 * Represents a therapy that applies to a certain diagnosis. Every diagnosis can be treated with
 * one or multiple therapies.
 */
export default class Therapy {

    /**
     * @param {Number} id                          ID (from API)
     * @param {{antibiotic: Antibiotic, markdownText: String}[]} recommendedAntibiotics
     *                                             Antibiotics recommended for treatment
     * @param {Number} priorityOrder               Priority of this therapy for a given diagnosis
     * @param {String} priorityName                Name of the priority, e.g. «First Choice»,
     *                                             «Alternative Choice»
     */
    constructor(id, recommendedAntibiotics = [], priorityOrder = 1, priorityName = '') {
        if (typeof id !== 'number') {
            throw new Error(`Therapy: First constructor argument (id) must be a number, is ${id}.`);
        }
        if (typeof priorityOrder !== 'number') {
            throw new Error(`Therapy: Constructor argument priorityOrder must be a number, is ${priorityOrder}.`);
        }
        if (typeof priorityName !== 'string') {
            throw new Error(`Therapy: Constructor argument priorityName must be a string, is ${priorityName}.`);
        }
        this.id = id;
        this.recommendedAntibiotics = recommendedAntibiotics;
        this.priority = {
            order: priorityOrder,
            name: priorityName,
        };
    }

    /**
     * Returns true if this therapy contains a recommended antibiotic that equals antibiotic passed
     * as param.
     * @param  {Antibiotic} antibiotic
     * @return {Boolean}
     */
    containsAntibiotic(antibiotic) {
        return this.recommendedAntibiotics
            .filter(recommendation => recommendation.antibiotic === antibiotic)
            .length > 0;
    }

}
