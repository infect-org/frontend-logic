import debug from 'debug';
import { computed, observable, action, observe } from 'mobx';
import calculateXPositions from './calculateXPositions';
import sortAntibiotics from './sortAntibiotics';
import AntibioticMatrixView from '../antibiotics/antibioticMatrixView';
import ResistanceMatrixView from '../resistances/resistanceMatrixView';
import SubstanceClassMatrixView from '../antibiotics/substanceClassMatrixView';
import SubstanceClass from '../antibiotics/substanceClass';
import BacteriumMatrixView from '../bacteria/bacteriumMatrixView';
import getArrayDiff from '../../helpers/getArrayDiff';

const log = debug('infect:MatrixView');

class MatrixView {

    /**
    * Space between resistances and between (resistances and antibiotic group dividers)
    */
    @observable space = 3;

    /**
     * Space between substance class groups
     * @type {Number}
     */
    @observable spaceBetweenGroups = 20;

    /**
    * Resistance that was hovered by the user
    */
    @observable activeResistance = undefined;

    /**
    * Largest and smallest sample size. Needed to calculate size of resistance circles.
    */
    @observable sampleSizeExtremes = {
        min: 0,
        max: 0,
    };

    /**
     * Key: antibioticId/bacteriumId, value: Resistance.
     * Deep watching is not required, as resistances have their own observable fields where needed.
     * @private
     */
    @observable.shallow _resistances = [];

    /**
     * Holds all antibiotic matrix views. Key: Antibiotic ID (for inverse resolution of matrixView
     * – mobx only allows numbers & shit), value: AntibioticMatrixView.
     * @private
     */
    @observable antibioticsMap = new Map();

    /**
     * Holds all substance class matrix views
     * @private
     */
    @observable substanceClassesMap = new Map();

    /**
     * Holds all bacteria matrix views
     */
    @observable bacteria = new Map();

    /**
    * Height of highest substance class label
    */
    @observable greatestSubstanceClassLabelHeight = undefined;


    _substanceClassLabelHeights = new Map();





    /**
     * Every bacterium label is only measured after it has been rendered into the DOM. To minimize
     * calculations and re-renders, we only calculate bacteria label column width after all
     * bacteria were rendered and measured.
     * @return {Bool}   True if all bacteria were rendered and measured
     */
    @computed get allBacteriaWereMeasured() {
        return Array.from(this.bacteria.values).every(bacterium => (
            bacterium.dimensions.width > -1 && bacterium.dimensions.height > -1
        ));
    }


    /**
     * Width of the bacterium column in matrix corresponds to the widest bacterium label's width
     * Calculate it here.
     * return {Number}     Width of column for bacterium labels. Is -1 if bacteria were not yet
     *                     measured
     */
    @computed get bacteriumLabelColumnWidth() {
        if (!this.allBacteriaWereMeasured) return -1;
        return Array.from(this.bacteria.values()).reduce((prev, bacterium) => (
            Math.max(bacterium.dimensions.width, prev)
        ), -1);
    }


    /**
     * Every antibiotic label is only measured after it has been rendered into the DOM. To minimize
     * calculations and re-renders, we only calculate antibiotic label row height after all
     * antibiotics were rendered and measured.
     * @return {Bool}   True if all antibiotics were rendered and measured
     */
    @computed get allAntibioticsWereMeasured() {
        return this.antibiotics.every(antibiotic => (
            antibiotic.dimensions.width > -1 && antibiotic.dimensions.height > -1
        ));
    }


    /**
     * Height of the label row above matrix corresponds to the highest antibiotic label
     * @return {Number}     Height of highest antibiotic label. Is -1 if antibiotics were not yet
     *                      measured
     */
    @computed get antibioticLabelRowHeight() {
        if (!this.allAntibioticsWereMeasured) return -1;
        const maxHeight = this.antibiotics.reduce((prev, antibiotic) => (
            Math.max(antibiotic.dimensions.width, prev)
        ), -1);
        log('Max height for antibiotic labels is %d', maxHeight, this.antibiotics);
        return maxHeight;
    }


    /**
     * Returns the «default» radius for our resistances; default radius is a resistances radius
     * that has not been adjusted by the resistance's sample size (which may reduce it if it is low)
     * @return {Number}     Default radius for resistances in matrix
     */
    @computed get defaultRadius() {

        // Only calculate radius when all data is available
        if (this.antibioticLabelRowHeight === -1) return 0;
        if (this.bacteriumLabelColumnWidth === -1) return 0;
        if (!this.dimensions) return 0;

        log('Calculate default radius');

        const numberOfAntibiotics = this.antibioticsMap.size;
        // Every time at least one substance class changes (from antibiotic to antibiotic), we have
        // to add an additional space.
        // Calculate how many times this happens.
        const numberOfSubstanceClassChanges = this.sortedAntibiotics.reduce((prev, item) => {
            if (!prev.item) {
                return {
                    count: 0,
                    item,
                };
            }
            const diffs = getArrayDiff(
                prev.item.antibiotic.getSubstanceClasses(),
                item.antibiotic.getSubstanceClasses(),
            );
            return {
                count: diffs.removed.length || diffs.added.length ? prev.count + 1 : prev.count,
                item,
            };
        }, { count: 0, item: undefined }).count;

        log(
            'Calculate defaultRadius; bacteriumLabelColumnWidth is %d, numberOfAntibiotics %d, numberOfSubstanceClassChanges %d, width %d',
            this.bacteriumLabelColumnWidth,
            numberOfAntibiotics,
            numberOfSubstanceClassChanges,
            this.dimensions.width,
        );

        // Available space: Width - widest label - first space (right of label) - space taken up
        // by right-most antibiotic
        const availableSpace = this.dimensions.width - this.space -
            this.bacteriumLabelColumnWidth - this.antibioticLabelRowHeight;

        const whitespace = (numberOfAntibiotics + numberOfSubstanceClassChanges) * this.space;

        log(
            'Available space: %d. Whitespace: %d',
            availableSpace,
            whitespace,
        );

        // Radius: Don't go below 0, always be an int.
        return Math.max(Math.floor((availableSpace - whitespace) / numberOfAntibiotics / 2), 1);

    }











    /**
    * Adds data for multiple properties at once. Is nice as all data becomes available at the
    * same time.
    */
    @action setupDataWatchers(antibiotics = [], bacteria = [], resistances) {

        observe(antibiotics.status, (change) => {
            if (change.newValue === 'ready') {
                antibiotics.getAsArray().forEach((antibiotic) => {
                    this.addAntibiotic(antibiotic);
                });
            }
        });

        observe(bacteria.status, (change) => {
            if (change.newValue === 'ready') {
                bacteria.getAsArray().forEach((bacterium) => {
                    this.addBacterium(bacterium);
                });
            }
        });

        observe(bacteria.get(), (change) => {
            if (change.type === 'delete') {
                this.removeBacterium(change.oldValue);
            }
        });

        // Resistances will change whenever a population filter is changed.
        // Make sure we're watching them.
        observe(resistances.status, (change) => {
            if (change.newValue !== 'ready') return;
            // Use own function as we need an @action
            this._clearResistances();
            resistances.getAsArray().forEach((resistance) => {
                this.addResistance(resistance);
            });
        });
    }

    @action _clearResistances() {
        this._resistances.clear();
    }



    setOffsetFilters(offsetFilters) {
        this._offsetFilters = offsetFilters;
    }

    getOffsetFilters() {
        return this._offsetFilters;
    }

    setSelectedFilters(selectedFilters) {
        this._selectedFilters = selectedFilters;
    }

    get selectedFilters() {
        return this._selectedFilters;
    }



    /**
    * Adds antibiotic
    * @param {Antibiotic} antibiotic
    */
    @action addAntibiotic(antibiotic) {
        // Add antibiotics
        if (this.antibioticsMap.has(antibiotic.id)) {
            throw new Error(`MatrixView: Trying to add antibiotic with duplicate key ${antibiotic.id}.`);
        }
        this.antibioticsMap.set(antibiotic.id, new AntibioticMatrixView(antibiotic, this));
        log('Added antibiotic %o, number is %d', antibiotic, this.antibioticsMap.size);
        // console.log('MatrixView: added ab, size is', antibiotic, this._antibiotics.size);
        // Add *all* substanceClasses of matrix (the whole hierarchy)
        const scs = antibiotic.getSubstanceClasses();
        scs.forEach((item) => {
            if (this.substanceClassesMap.has(item.id)) return;
            this.substanceClassesMap.set(item.id, new SubstanceClassMatrixView(item, this));
        });
    }

    @computed get antibiotics() {
        return Array.from(this.antibioticsMap.values());
    }

    /**
    * Returns AntibioticView for the antibiotic passed in.
    */
    getAntibioticView(antibiotic) {
        return this.antibioticsMap.get(antibiotic.id);
    }

    @computed get substanceClasses() {
        return Array.from(this.substanceClassesMap.values());
    }


    /**
    * @returns {Array}      Array of antibiotics sorted for matrix, each item is a
    *                       AntibioticMatrixView
    */
    @computed get sortedAntibiotics() {
        // Convert to Antibiotics and then back to AntibioticMatrixViews. Why? Because it makes
        // the sortFunction simpler
        const sorted = sortAntibiotics(this.antibiotics.map(item => item.antibiotic));
        return sorted.map(antibiotic => this.antibioticsMap.get(antibiotic.id));
    }

    /**
    * Calculate xPositions for AB and SCs; do it here (instead of in every single component) to
    * speed things up; values are calculated only **once** after anything changes.
    *
    * @returns {Map}        Key: AntibioticMatrixView or SubstanceClassMatrixView; value: Object
    *                       with left and right
    */
    @computed get xPositions() {
        const xPositions = calculateXPositions(
            this.sortedAntibiotics,
            this.defaultRadius * 2,
            this.space,
        );
        // Map raw ab/scs to corresponding martrixViews
        const result = new Map();
        xPositions.forEach((value, key) => {
            const newKey = key instanceof SubstanceClass ? this.substanceClassesMap.get(key.id) :
                key;
            result.set(newKey, value);
        });
        return result;
    }

    /**
     * Returns with of all visible antibiotics (corresponds to position.right of the right-most
     * antibiotic or substance class)
     * @return {Number}
     */
    @computed get visibleAntibioticsWidth() {
        let rightMostPosition = 0;
        this.xPositions.forEach((position) => {
            // right property is not set if antibiotic is invisble
            if (position.right === undefined) return;
            rightMostPosition = Math.max(rightMostPosition, position.right);
        });
        return rightMostPosition;
    }










    @computed get maxAmountOfSubstanceClassHierarchies() {
        return this.antibiotics.reduce((prev, item) => (
            Math.max(prev, item.antibiotic.getSubstanceClasses().length)
        ), 0);
    }

    /**
    * Called from SubstanceClassLabel. Set label height's, get greatest height after
    * all labels were measured.
    */
    @action setSubstanceClassHeight(substanceClass, value) {
        this._substanceClassLabelHeights.set(substanceClass, value);
        if (this._substanceClassLabelHeights.size === this.substanceClasses.length) {
            this._calculateGreatestSubstanceClassLabelHeight();
        }
    }

    @action _calculateGreatestSubstanceClassLabelHeight() {
        const heights = Array.from(this._substanceClassLabelHeights.values());
        this.greatestSubstanceClassLabelHeight = Math.ceil(heights.reduce((prev, item) => (
            Math.max(item, prev)
        )), 0);
        log('greatestSubstanceClassLabelHeight is %d', this.greatestSubstanceClassLabelHeight);
    }

    @computed get headerHeight() {
        // if (this._substanceClassLabelHeights.size < this._substanceClasses.size) return 0;
        // if (this._antibioticLabelDimensions.size < this._antibiotics.size) return 0;
        if (!this.antibioticLabelRowHeight) return 0;
        return this.antibioticLabelRowHeight + (this.spaceBetweenGroups / 2) +
            (this.maxAmountOfSubstanceClassHierarchies * (this.greatestSubstanceClassLabelHeight) ||
            0);
    }







    @action addResistance(resistance) {
        this._resistances.push(new ResistanceMatrixView(resistance, this));
        this._updateSampleSizeExtremes(resistance);
    }

    @computed get resistances() {
        return this._resistances;
    }

    @action _updateSampleSizeExtremes(resistance) {
        const mostPrecise = resistance.getValuesByPrecision()[0];
        if (
            this.sampleSizeExtremes.min === 0 ||
            mostPrecise.sampleSize < this.sampleSizeExtremes.min
        ) {
            this.sampleSizeExtremes.min = mostPrecise.sampleSize;
        }
        if (mostPrecise.sampleSize > this.sampleSizeExtremes.max) {
            this.sampleSizeExtremes.max = mostPrecise.sampleSize;
        }
    }

    /**
    * Sets or removes the active resistance (that is hovered by the user's input device).
    * @param {ResistanceMatrixView || undefined} resistance         Active resistance or undefined
    *                                                               to reset it.
    */
    @action setActiveResistance(resistance) {
        this.activeResistance = resistance;
    }





    /**
    * Sets dimensions of the SVG whenever it is changed.
    * @param {BoundingClientRects} boundingBox
    */
    @action setDimensions(boundingBox) {
        log('Set dimensions to %o', boundingBox);
        this.dimensions = {
            height: boundingBox.height,
            width: boundingBox.width,
        };
    }






    @action addBacterium(bacterium) {
        this.bacteria.set(bacterium.id, new BacteriumMatrixView(bacterium, this));
    }

    @action removeBacterium(bacterium) {
        this.bacteria.delete(bacterium.id);
    }

    /**
    * Returns bacteria, sorted A->Z
    * @param {Array}        Array of bacteria, sorted
    */
    @computed get sortedBacteria() {
        return Array.from(this.bacteria.values()).sort((a, b) => (
            a.bacterium.name < b.bacterium.name ? -1 : 1
        ));
    }

    @computed get sortedVisibleBacteria() {
        return this.sortedBacteria.filter(item => item.visible);
    }



    getBacteriumView(bacterium) {
        return this.bacteria.get(bacterium.id);
    }




    /**
    * Return y positions for bacteria (not including the column labels on top of the matrix). See
    * get xPositions.get
    *
    * @ returns {Map}       Key: bacterium, value: Object with top
    */
    @computed get yPositions() {
        if (!this.defaultRadius) return new Map();

        log('calculate yPositions');
        const yPositions = new Map();
        this.sortedBacteria
            .filter(item => item.visible)
            .forEach((bacterium, index) => {
                yPositions.set(bacterium, {
                    top: index * ((this.defaultRadius * 2) + this.space),
                });
            });
        return yPositions;
    }

    /**
     * Returns the height (in px) for all bacteria that are currently visible.
     * @return {Number}
     */
    @computed get visibleBacteriaHeight() {
        return Array.from(this.yPositions.values())
            .reduce((prev, yPosition) => (
                yPosition && yPosition.top > prev ? yPosition.top : prev
            ), 0) + (this.defaultRadius || 0);
    }

}

export default MatrixView;
