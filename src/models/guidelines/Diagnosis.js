/**
 * Represents a diagnosis (e.g. «Harnwegsinfekt, Unkomplizierte Zystitis») that belongs to *one*
 * guideline. Diagnosis have *no* hierarchy; there is not one «Harnwegsinfekt» with sub diagnosis
 * «Asymptomatische Bakteriurie», «Unkomplizierte Zystitis» etc.
 */
export default class Diagnosis {

    /**
     * @param {Object} param
     * @param {Number} param.id                      ID (from API)
     * @param {String} param.name                    Name of diagnosis, e.g. «Komplizierte Zystitis»
     * @param {DiagnosisClass} param.diagnosisClass  Chapter that a (printed) guideline is
     *                                               structured by
     * @param {Bacterium[]} param.inducingBacteria   List of bacteria that may induce the diagnosis
     * @param {String} param.markdownText            Explanation of diagnosis (Markdown)
     * @param {Therapy[]} param.therapies            Suggested therapies for current diagnosis
     * @param {String[]} param.synonyms              Synonyms for param.name that are also
     *                                               considered when user searchs diagnoses
     * @param {String} param.link                    Link to the diagnosis' original text
     * @param {Object} param.latestUpdate            Data for the latest update that was made to
     *                                               the diagnosis
     * @param {String} param.latestUpdate.name       Name of the data source the updated data was
     *                                               taken from
     * @param {String} param.latestUpdate.link       Link to the data source the updated data was
     *                                               taken from
     * @param {Date} param.latestUpdate.date         Date the update was made on
     */
    constructor({
        id,
        name,
        diagnosisClass,
        link,
        synonyms,
        latestUpdate,
        inducingBacteria = [],
        markdownText = '',
        therapies = [],
    } = {}) {
        // Test parameters that are passed directly from API
        if (typeof id !== 'number') {
            throw new Error(`Diagnosis: First constructor argument (id) must be a number, is ${id}.`);
        }
        if (typeof name !== 'string') {
            throw new Error(`Diagnosis: Second constructor argument (name) must be a string, is ${name}.`);
        }
        if (typeof markdownText !== 'string') {
            throw new Error(`Diagnosis: Constructor argument markdownText must be a string, is ${markdownText}.`);
        }
        if (
            synonyms &&
            (!Array.isArray(synonyms) || synonyms.find(synonym => typeof synonym !== 'string'))
        ) {
            throw new Error(`Diagnosis: Constructor argument synonyms must be an Array of Strings, is ${synonyms}.`);
        }
        this.id = id;
        this.name = name;
        this.diagnosisClass = diagnosisClass;
        this.inducingBacteria = inducingBacteria;
        this.markdownText = markdownText;
        this.therapies = therapies;
        this.latestUpdate = latestUpdate;
        this.link = link;
        this.synonyms = synonyms;
    }

    /**
     * On the API, id_guideline is part of diagnosis data; we want it the opposite way (diagnoses
     * belong to guideline) and have therefore to store the relation temporarily (see
     * GuidelineFetcher and DiagnosisFetcher).
     * @param {Number} id   Guideline's ID on API
     */
    setGuidelineId(id) {
        this.guidelineId = id;
    }

    /**
     * Removes the guidelineId property completely when not needed any more (i.e. after setting up
     * the guidelines).
     * See https://github.com/infect-org/infect-frontend-logic/pull/2#discussion_r320131912
     */
    removeGuidelineId() {
        delete this.guidelineId;
    }

}
