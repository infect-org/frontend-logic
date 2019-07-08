import Guideline from './Guideline';
import Therapy from './Therapy';
import Diagnosis from './Diagnosis';
import DiagnosisClass from './DiagnosisClass';

/**
 * Temporary solution that mocks all Guideline data (until API is done). TODO: Connect API through
 * a real fetcher. Maybe use multiple stores and fetchers (one per model entity).
 */
export default class GuidelineFetcher {

    constructor(guidelineStore, antibioticsStore, bacteriaStore) {
        this.guidelineStore = guidelineStore;
        this.antibioticsStore = antibioticsStore;
        this.bacteriaStore = bacteriaStore;
    }

    getData() {

        // Sort antibiotics and bacteria by ID to ensure that we always take the same antibiotics/
        // bacteria to construct our fake guideline data. Sort modifies original array, use
        // Array.from to clone.
        const sortedAntibiotics = Array
            .from(this.antibioticsStore.getAsArray())
            .sort((a, b) => a.id - b.id);
        const sortedBacteria = Array
            .from(this.bacteriaStore.getAsArray())
            .sort((a, b) => a.id - b.id);


        const urinaryTractDiagnosisClass = new DiagnosisClass(0, 'Urinary Tract');



        /** ***********************************************
         * KOMPLIZIERTE ZYSTITIS
         *********************************************** */
        const komplizierteZystitisTherapy1 = new Therapy(
            0,
            [
                {
                    antibiotic: sortedAntibiotics[0],
                    markdownText: `
                        * TMP/SMX forte alle 12 h für 7 d
                        * (Anpassung gemäss Urinkultur!)
                        * **ODER**
                    `,
                }, {
                    antibiotic: sortedAntibiotics[1],
                    markdownText: `
                        Nitrofurantoin [100 mg](http://infect.info) alle 12 h für 7 d
                    `,
                },
            ],
            1,
            'Erste Wahl',
        );

        const komplizierteZystitisTherapy2 = new Therapy(
            1,
            [
                {
                    antibiotic: sortedAntibiotics[2],
                    markdownText: `
                       Ciprofloxacin 500 mg alle 12 h für 7 d
                    `,
                },
            ],
            2,
            'Zweite Wahl',
        );

        const komplizierteZystitis = new Diagnosis(
            1,
            'Komplizierte Zystitis',
            urinaryTractDiagnosisClass,
            sortedBacteria.slice(0, 4),
            'V.a. **akute Prostatitis**: Therapiedauer mind. 14 d (TMP/SMX oder Ciprofloxacin)',
            [komplizierteZystitisTherapy1, komplizierteZystitisTherapy2],
        );



        /** ***********************************************
         * UNKOMPLIZIERTE ZYSTITIS
         *********************************************** */
        const unkomplizierteZystitisTherapy1 = new Therapy(
            0,
            [
                {
                    antibiotic: sortedAntibiotics[5],
                    markdownText: `
                        Fosfomycin 3 g als __abendliche__ Einmaldosis
                    `,
                }, {
                    antibiotic: sortedAntibiotics[10],
                    markdownText: `
                        Nitrofurantoin 100 mg alle 12 h für 5 d
                    `,
                }, {
                    antibiotic: sortedAntibiotics[10],
                    markdownText: `
                         TMP / SMX forte alle 12h für 3d (lokale Resistenzlage E.coli beachten, 
                         aktuell in der Ostschweiz für junge Frauen mit erstmaliger Symptomatik 
                         weiterhin 1. Wahl)
                    `,
                },
            ],
            1,
            'Erste Wahl',
        );

        const unkomplizierteZystitisTherapy2 = new Therapy(
            1,
            [
                {
                    antibiotic: sortedAntibiotics[9],
                    markdownText: `
                       Ciprofloxacin 500 mg alle 12 h für 7 d
                    `,
                },
            ],
            2,
            'Alternativ',
        );

        const unkomplizierteZystitis = new Diagnosis(
            2,
            'Unkomplizierte Zystitis (Frau prämenopausal)',
            urinaryTractDiagnosisClass,
            sortedBacteria.slice(4, 8),
            'Daran denken, dass urogenitale Symptome nicht immer auf HWI weisen, deshalb Diagnostik wichtig!',
            [unkomplizierteZystitisTherapy1, unkomplizierteZystitisTherapy2],
        );





        const sgiGuideline = new Guideline(
            1,
            'Schweizerische Gesellschaft für Infektiologie',
            [komplizierteZystitis, unkomplizierteZystitis],
        );

        this.guidelineStore.add(sgiGuideline);

    }

}
