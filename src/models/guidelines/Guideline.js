import { observable, action } from 'mobx';
import debug from 'debug';

const log = debug('infect:Guideline');

/**
 * Represents a single guideline (from a hospital, institution or society, e.g. «Schweiz.
 * Gesellschaft für Infektiologie»)
 */
export default class Guideline {

    /**
     * Holds the diagnosis that the user selected; matrix is highlighted correspondingly, diagnosis
     * might be displayed in drawer.
     */
    @observable selectedDiagnosis;

    /**
     * @param {Object} param
     * @param {Number} param.id             ID of guideline (on API)
     * @param {String} param.name           Guideline's name, mostly name of the publishing
     *                                      institution (e.g. «Schweiz. Ges. für Infektiologie»)
     * @param {Diagnosis[]} param.diagnoses Array of all diagnoses that this guideline consists of
     * @param {String} param.contactEmail   Contact email to for feedback concerning guideline
     */
    constructor({
        id,
        name,
        link,
        diagnoses = [],
        markdownDisclaimer = '',
        contactEmail,
    } = {}) {

        if (typeof id !== 'number') {
            throw new Error(`Guideline: Constructor argument id must be a number, is ${id}.`);
        }
        if (typeof name !== 'string') {
            throw new Error(`Guideline: Constructor argument name must be a string, is ${name}.`);
        }
        if (typeof link !== 'string') {
            throw new Error(`Guideline: Constructor argument link must be a string, is ${link}.`);
        }
        this.id = id;
        this.name = name;
        this.link = link;
        this.diagnoses = diagnoses;
        this.markdownDisclaimer = markdownDisclaimer;
        this.contactEmail = contactEmail;
    }

    /**
     * Update selected diagnosis
     * @param  {Diagnosis} [diagnosis]  Diagnosis to select
     */
    @action selectDiagnosis(diagnosis) {
        // Check if diagnosis is part of this.diagnoses
        if (diagnosis !== undefined && !this.diagnoses.includes(diagnosis)) {
            throw new Error(`Guideline: Selected diagnosis ${JSON.stringify(diagnosis)} is not part of this guideline's diagnoses.`);
        }
        log('Select diagnosis %o', diagnosis);
        this.selectedDiagnosis = diagnosis;
    }

}
