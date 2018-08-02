export default {


    'antibiotics': [
        {
            "po": false,
            "iv": true,
            "languagae": "de",
            "id_language": 1,
            "name": "Ceftazidim",
            "substances": [
                "Ceftazidim"
            ],
            "substanceClasses": [
                {
                    "id": 18,
                    "id_locale": 1,
                    "languagae": "de",
                    "name": "3. Gen. Cephalosporine"
                },
                {
                    "id": 4,
                    "id_locale": 1,
                    "languagae": "de",
                    "name": "Betalactame"
                },
                {
                    "id": 9,
                    "id_locale": 1,
                    "languagae": "de",
                    "name": "Cephalosporine"
                }
            ],
            "id": 6
        },
        {
            "po": false,
            "iv": false,
            "languagae": "de",
            "id_language": 1,
            "name": "Cefotaxim",
            "substances": [
                "Cefotaxim"
            ],
            "substanceClasses": [
                {
                    "id": 18,
                    "id_locale": 1,
                    "languagae": "de",
                    "name": "3. Gen. Cephalosporine"
                },
                {
                    "id": 4,
                    "id_locale": 1,
                    "languagae": "de",
                    "name": "Betalactame"
                },
                {
                    "id": 9,
                    "id_locale": 1,
                    "languagae": "de",
                    "name": "Cephalosporine"
                }
            ],
            "id": 8
        }
    ]



    , bacteria: [
        {
            "aerobic": true,
            "aerobicOptional": false,
            "anaerobic": false,
            "anaerobicOptional": false,
            "genus": "Chlamydophila",
            "gram": false,
            "grouping": "",
            "groupingLocales": [],
            "id": 1,
            "id_grouping": null,
            "id_shape": null,
            "id_species": 27,
            "localeNames": [],
            "name": "Chlamydophila sp.",
            "selectedLanguage": "de",
            "selectedLanguageId": 1,
            "shape": "",
            "shapeLocales": [],
            "species": "Chlamydophila sp."
        },
        {
            "aerobic": true,
            "aerobicOptional": false,
            "anaerobic": false,
            "anaerobicOptional": true,
            "genus": "Actinomyces",
            "gram": true,
            "grouping": "",
            "groupingLocales": [],
            "id": 2,
            "id_grouping": null,
            "id_shape": null,
            "id_species": 28,
            "localeNames": [],
            "name": "Actinomyces sp.",
            "selectedLanguage": "de",
            "selectedLanguageId": 1,
            "shape": "",
            "shapeLocales": [],
            "species": "Actinomyces sp."
        }
    ]




    , resistances: [
        {
            "id_bacteria": 1,
            "id_compound": 6,
            "classResistanceDefault": 0.5,
            "resistanceImport": 0.2,
            "bacteriaName": "Ceftazidim",
            "compoundName": "Chlamydophila sp. / test"
        },
        {
            "id_bacteria": 2,
            "id_compound": 8,
            "classResistanceDefault": 0.3,
            "resistanceImport": 0.1,
            "bacteriaName": "Ceftazidim",
            "compoundName": "Actinomyces sp. / test"
        }
    ]

    , substanceClasses: [
        { name: 'test', id: 18, parent: null }
        , { name: 'test', id: 4, parent: 18 }
        , { name: 'test', id: 9, parent: 4 }
    ]

};