/**
 * Represents a diagnosis (e.g. «Harnwegsinfekt, Unkomplizierte Zystitis») that belongs to *one*
 * guideline. Diagnosis have *no* hierarchy; there is not one «Harnwegsinfekt» with sub diagnosis
 * «Asymptomatische Bakteriurie», «Unkomplizierte Zystitis» etc.
 */
export default class Diagnosis {

    /**
     * @param {Number} id                      ID (from API)
     * @param {String} name                    Name of diagnosis, e.g. «Komplizierte Zystitis»
     * @param {DiagnosisClass} diagnosisClass  Chapter that a (printed) guideline is structured by
     * @param {Bacterium[]} inducingBacteria   List of bacteria that may induce the diagnosis
     * @param {String} markdownText            Explanation of diagnosis (Markdown)
     * @param {Therapy[]} therapies            Suggested therapies for current diagnosis
     */
    constructor(
        id,
        name,
        diagnosisClass,
        inducingBacteria = [],
        markdownText = '',
        therapies = [],
    ) {
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
        this.id = id;
        this.name = name;
        this.diagnosisClass = diagnosisClass;
        this.inducingBacteria = inducingBacteria;
        this.markdownText = markdownText;
        this.therapies = therapies;
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
     * the guidelines)
     */
    removeGuidelineId() {
        delete this.guidelineId;
    }

}
