import Fuse from 'fuse.js';
import createDiagnosesSearchData from './createDiagnosesSearchData.js';

export default function searchDiagnoses(guidelines, searchTerm) {

    // Strangely, with our test data, all data is returned even if searchTerm is '' and even though
    // minMatchCharLength is 1. Make sure that an empty search term returns no results.
    if (searchTerm === '') return [];

    const data = createDiagnosesSearchData(guidelines);

    const fuseOptions = {
        shouldSort: true,
        threshold: 0.3,
        tokenize: true,
        minMatchCharLength: 1,
        keys: [
            { name: 'name', weight: 0.7 },
            { name: 'synonym', weight: 0.3 },
        ],
    };

    const fuse = new Fuse(data, fuseOptions);
    const results = fuse.search(searchTerm);

    // Make sure every diagnosis is only part of results once (if multiple synonyms match). If
    // diagnosis1.name is a match, use this one instead of any synonyms that match for diagnosis1.
    return results.reduce((prev, result) => (
        prev.find(item => item.diagnosis === result.diagnosis) ? prev : [...prev, result]
    ), []);

}
