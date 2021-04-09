import filterTypes from '../filters/filterTypes.js';

export default function() {
    return [{
        entityType: filterTypes.antibiotic
        , config: {
            name: {
                translation: 'Name'
                , valueTranslations: (name) => name
            }
            , iv: {
                translation: 'Intravenous'
                , valueTranslations: [{
                    value: true
                    , translation: 'Intravenous'
                }, {
                    value: false
                    , translation: 'Not intravenous'
                }]
            }
            , po: {
                translation: 'Per Os'
                , valueTranslations: [{
                    value: true
                    , translation: 'Per os'
                }, {
                    value: false
                    , translation: 'Not per os'
                }]
            }
        }
    }, {
        entityType: filterTypes.region
        , config: {
            // The property we need is id
            id: {
                translation: 'Name'
                // Get name from the whole entity
                , valueTranslations: (name, entity) => entity.name
            }
        }
    }, {
        entityType: filterTypes.ageGroup
        , config: {
            // The property we need is id
            id: {
                translation: 'Name'
                // Get name from the whole entity
                , valueTranslations: (name, entity) => entity.label,
            }
        }
    }, {
        entityType: filterTypes.hospitalStatus,
        config: {
            // The property we need is id
            id: {
                translation: 'Name',
                // Get name from the whole entity
                valueTranslations: (name, entity) => entity.name,
            },
        },
    }, {
        entityType: filterTypes.animal,
        config: {
            // The property we need to add the filter is id
            id: {
                translation: 'Name',
                // Get name from the whole entity
                valueTranslations: (name, entity) => entity.name,
            },
        },
    }, {
        entityType: filterTypes.substanceClass
        , config: {
            name: {
                translation: 'Name'
                , valueTranslations: (name) => name
            }
        }
    }, {
        entityType: filterTypes.sampleSource,
        config: {
            id: {
                translation: 'Name',
                valueTranslations: (name, entity) => entity.name,
            },
        },
    }, {
        entityType: filterTypes.bacterium
        , config: {
            name: {
                translation: 'Name'
                , valueTranslations: (name) => name
            }
            , gram: {
                translation: 'Gram'
                , valueTranslations: [{
                    value: true
                    , translation: 'Gram+'
                }, {
                    value: false
                    , translation: 'Gram-'
                }]
            }
            , aerobic: {
                translation: 'Aerobic'
                , valueTranslations: [{
                    value: true
                    , translation: 'Aerobic'
                }, {
                    value: false
                    , translation: 'Not aerobic'
                }]
            }
            , anaerobic: {
                translation: 'Anaerobic'
                , valueTranslations: [{
                    value: true
                    , translation: 'Anaerobic'
                }, {
                    value: false
                    , translation: 'Not anaerobic'
                }]
            }
            , shape: {
                translation: 'Shape'
                , valueTranslations: (shape) => shape
            }
        }
    }];
};