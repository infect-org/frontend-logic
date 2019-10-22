/**
 * Creates data structure that we can use for fuse
 * @param {Object} guidelines   Array of guidelines (as returned by GuidelineStore.getAsArray())
 * @return {Object[]}           One object for every diagnosis and every synonym variation of
 *                              diagnosis in the form of: [{
 *                                  name: 'diagnosis-1',
 *                                  synonym: '',
 *                                  diagnosis,
 *                                  guideline,
 *                              }, {
 *                                  name: 'diagnosis-1',
 *                                  synonym: 'synonym-1',
 *                                  diagnosis,
 *                                  guideline,
 *                              }]
 */
export default function createDiagnosesSearchData(guidelines) {

    return guidelines
        .map(guideline => (

            guideline.diagnoses.map(diagnosis => (

                // Add empty synonym so that we can loop over all variations, including the
                // diagnosis name without any synonym.
                ['', ...diagnosis.synonyms].map(synonym => ({
                    name: diagnosis.name,
                    synonym,
                    diagnosis,
                    guideline,
                }))

            ))

        ))
        .flat(3);

}
