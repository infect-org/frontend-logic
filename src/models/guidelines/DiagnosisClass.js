/**
 * A diagnosisClass is used to structure a (printed) guideline into chapters and may e.g. be an
 * organ system («Urinary Tract»).
 */
export default class DiagnosisClass {

    /**
     * @param  {Number} id    ID (from API)
     * @param  {[type]} name  Name of diagnosis class (e.g. «Urinary Tract»)
     */
    constructor(id, name = '') {
        if (typeof id !== 'number') {
            throw new Error(`DiagnosisClass: First constructor argument (id) must be a number, is ${id}.`);
        }
        if (typeof name !== 'string') {
            throw new Error(`DiagnosisClass: Second constructor argument (name) must be a string, is ${name}.`);
        }
        this.id = id;
        this.name = name;
    }

}
