import test from 'tape';
import GuidelineSelectedFiltersBridge from './GuidelineSelectedFiltersBridge.js';
import SelectedFilters from '../filters/selectedFilters.js';
import filterTypes from '../filters/filterTypes.js';

/**
 * As GuidelineSelectedFiltersBridge mainly integrates selected filters, filter values and
 * guidelines, we check its integration (instead of using unit tests). As guidelines are hard to
 * setup, we use a mock.
 */

const setupData = () => {

    // We must ensure that getValuesForProperty always returns the same (referenced) data and
    // does not create new entries.
    const values = {
        bacteria: [
            { type: 'bact', value: 'bact1', id: Math.random() },
            { type: 'bact', value: 'bact2' },
            // Should not be added
            { type: 'bact', value: 'bact3' },
        ],
        antibiotics: [
            { type: 'ab', value: 'ab1' },
            { type: 'ab', value: 'ab2' },
            { type: 'ab', value: 'ab3' },
            // Should not be added
            { type: 'ab', value: 'ab4' },
        ],
    };

    const filterValues = {
        getValuesForProperty: (type, field) => {
            if (type === filterTypes.bacterium && field === 'name') {
                return values.bacteria;
            } else if (type === filterTypes.antibiotic && field === 'name') {
                return values.antibiotics;
            }
            throw new Error(`Unexpected call to ${type}/${field}.`);
        },
    };
    const selectedFilters = new SelectedFilters();
    const guidelineStore = {
        getSelectedDiagnosis: () => ({
            inducingBacteria: [{
                name: 'bact1',
            }, {
                name: 'bact2',
            }],
            therapies: [{
                recommendedAntibiotics: [{
                    antibiotic: {
                        name: 'ab1',
                    },
                }, {
                    antibiotic: {
                        name: 'ab2',
                    },
                }],
            }, {
                recommendedAntibiotics: [{
                    antibiotic: {
                        name: 'ab3',
                    },
                }],
            }],
        }),
    };

    const bridge = new GuidelineSelectedFiltersBridge(
        guidelineStore,
        selectedFilters,
        filterValues,
    );

    return {
        selectedFilters,
        filterValues,
        guidelineStore,
        bridge,
    };

};


test('selects bacteria and antibiotics for diagnosis', (t) => {
    const { bridge, selectedFilters, filterValues } = setupData();
    bridge.selectFiltersRelatedToSelectedDiagnosis();
    t.is(selectedFilters.filters.length, 5);
    const selectedBacteria = filterValues
        .getValuesForProperty(filterTypes.bacterium, 'name')
        .slice(0, 2);
    const selectedAntibiotics = filterValues
        .getValuesForProperty(filterTypes.antibiotic, 'name')
        .slice(0, 3);
    t.deepEqual(selectedFilters.filters, [...selectedBacteria, ...selectedAntibiotics]);
    t.end();
});

test('does not fail if no diagnosis is selected', (t) => {
    const { bridge, guidelineStore, selectedFilters } = setupData();
    // There is no selected diagnosis
    guidelineStore.getSelectedDiagnosis = () => undefined;
    bridge.selectFiltersRelatedToSelectedDiagnosis();
    t.is(selectedFilters.filters.length, 0);
    t.end();
});

test('does not fail if bacteria/antibiotics are missing', (t) => {
    const { bridge, filterValues, selectedFilters } = setupData();
    // There are no filterValues
    filterValues.getValuesForProperty = () => [];
    bridge.selectFiltersRelatedToSelectedDiagnosis();
    t.is(selectedFilters.filters.length, 0);
    t.end();
});

test('adds to existing selectedFilters', (t) => {
    const { bridge, filterValues, selectedFilters } = setupData();
    // Pre-select all bacteria
    filterValues
        .getValuesForProperty(filterTypes.bacterium, 'name')
        .forEach(filter => selectedFilters.addFilter(filter));
    bridge.selectFiltersRelatedToSelectedDiagnosis();
    // 5 filters for selected diagnosis plus the third bacterium
    t.is(selectedFilters.filters.length, 6);
    t.end();
});




test('returns correct value for areAllDiagnosisRelatedFiltersSelected', (t) => {
    const { bridge, filterValues, selectedFilters } = setupData();
    // None are selected
    t.is(bridge.areAllDiagnosisRelatedFiltersSelected(), false);
    // All relevant filters are selected
    bridge.selectFiltersRelatedToSelectedDiagnosis();
    t.is(bridge.areAllDiagnosisRelatedFiltersSelected(), true);
    // Add additional filter
    const additionalFilter = filterValues.getValuesForProperty(filterTypes.bacterium, 'name')[2];
    selectedFilters.addFilter(additionalFilter);
    t.is(bridge.areAllDiagnosisRelatedFiltersSelected(), true);
    // Remove a relevant filter
    selectedFilters.removeFilter(selectedFilters.filters[0]);
    t.is(bridge.areAllDiagnosisRelatedFiltersSelected(), false);
    t.end();
});



