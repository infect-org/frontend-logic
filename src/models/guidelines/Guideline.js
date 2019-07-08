/**
 * Represents a single guideline (from a hospital, institution or society, e.g. «Schweiz.
 * Gesellschaft für Infektiologie»)
 */
export default class Guideline {

    /**
     * @param  {Number} id              ID of guideline (on API)
     * @param  {String} name            Guideline's name, mostly name of the publishing institution
     *                                  (e.g. «Schweiz. Ges. für Infektiologie»)
     * @param  {Diagnosis[]} diagnoses  Array of all diagnoses that this guideline consists of
     */
    constructor(id, name = '', diagnoses = []) {

        if (typeof id !== 'number') {
            throw new Error(`Guideline: First constructor argument (id) must be a number, is ${id}.`);
        }
        if (typeof name !== 'string') {
            throw new Error(`Guideline: Second constructor argument (name) must be a string, is ${name}.`);
        }
        this.id = id;
        this.name = name;
        this.diagnoses = diagnoses;
    }

}
