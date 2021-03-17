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
import storeStatus from '../../helpers/storeStatus.js';

const log = debug('infect:MatrixView');

class MatrixView {


    /**
    * Default radius for resistances (with a standard sample size); effective radius
    * depends on sample size.
    */
    @observable defaultRadius = undefined;

    /**
    * Widest bacterium label
    */
    @observable bacteriumLabelColumnWidth = undefined;

    /**
    * Highest/widest antibiotic label. As label is rotated by 45°, height equals width
    */
    @observable antibioticLabelRowHeight = undefined;

    /**
    * Space between resistances and between (resistances and antibiotic group dividers)
    */
    @observable space = 3;

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
     */
    @observable.shallow _resistances = [];

    /**
    * Height of highest substance class label
    */
    @observable greatestSubstanceClassLabelHeight = undefined;

    constructor() {

        // #todo: Why do decorators not work for Maps? Maybe it's a cross-compiling issue?
        /* Key: Antibiotic ID (for inverse resolution of matrixView – mobx only allows numbers &
        shit), value: AntibioticMatrixView. Problem: Updates to map (original data) is not reflected
        here */
        this._antibiotics = observable.map();
        // Substance classes are added whenever an antibiotic is added.
        this._substanceClasses = observable.map();
        /* Key: Bacterium ID (for inverse resolution of matrixView – mobx only allows promitives
           as keys),
           value: BacteriumMatrixView */
        this._bacteria = observable.map();
        /* Key: antibioticId/bacteriumId, value: Resistance */
        // this._resistances = observable.map();

        // Space between labels (bact/ab) and body
        this.spaceBetweenGroups = 20;

        // Needed to calculate space that's available for the matrices content
        // Key: antibiotic, value: height in px
        this._antibioticLabelDimensions = new Map();
        this._bacteriaLabelWidths = new Map();
        this._substanceClassLabelHeights = new Map();

    }


    /**
    * Adds data for multiple properties at once. Is nice as all data becomes available at the
    * same time.
    */
    @action setupDataWatchers(antibiotics = [], bacteria = [], resistances) {

        observe(antibiotics.status, (change) => {
            if (change.newValue === storeStatus.ready) {
                antibiotics.getAsArray().forEach((antibiotic) => {
                    this.addAntibiotic(antibiotic);
                });
            }
        });

        observe(bacteria.status, (change) => {
            if (change.newValue === storeStatus.ready) {
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
            if (change.newValue !== storeStatus.ready) return;
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
        if (this._antibiotics.has(antibiotic.id)) {
            throw new Error(`MatrixView: Trying to add antibiotic with duplicate key ${antibiotic.id}.`);
        }
        this._antibiotics.set(antibiotic.id, new AntibioticMatrixView(antibiotic, this));
        log('Added antibiotic %o, number is %d', antibiotic, this._antibiotics.size);
        // console.log('MatrixView: added ab, size is', antibiotic, this._antibiotics.size);
        // Add *all* substanceClasses of matrix (the whole hierarchy)
        const scs = antibiotic.getSubstanceClasses();
        scs.forEach((item) => {
            if (this._substanceClasses.has(item.id)) return;
            this._substanceClasses.set(item.id, new SubstanceClassMatrixView(item, this));
        });
    }

    @computed get antibiotics() {
        return Array.from(this._antibiotics.values());
    }

    /**
    * Returns AntibioticView for the antibiotic passed in.
    */
    getAntibioticView(antibiotic) {
        return this._antibiotics.get(antibiotic.id);
    }

    @computed get substanceClasses() {
        return Array.from(this._substanceClasses.values());
    }


    /**
    * @returns {Array}      Array of antibiotics sorted for matrix, each item is a
    *                       AntibioticMatrixView
    */
    @computed get sortedAntibiotics() {
        // Convert to Antibiotics and then back to AntibioticMatrixViews. Why? Because it makes
        // the sortFunction simpler
        const sorted = sortAntibiotics(this.antibiotics.map(item => item.antibiotic));
        return sorted.map(antibiotic => this._antibiotics.get(antibiotic.id));
    }

    /**
    * Set height and width of ab labels. Width is needed because labels are at a 45° angle;
    * the right-most label takes up additional space. Both width and height are based on the
    * 45° angle.
    */
    @action setAntibioticLabelDimensions(antibiotic, width, height) {
        // log('Set dimensions of antibiotic label for %o to %d/%d', antibiotic, width, height);
        if (width % 1 !== 0 || height % 1 !== 0) {
            throw new Error('MatrixView: Width and height for antibiotic labels must be integers.');
        }
        const existing = this._antibioticLabelDimensions.get(antibiotic);
        // No changes to previous value: Return to prevent unnecessary re-renderings
        if (existing && existing.height === height && existing.width === width) return;
        this._antibioticLabelDimensions.set(antibiotic, {
            width,
            height,
        });
        this._calculateAntibioticLabelRowHeight();
        // Default radius depends on antibiotic label as it they are slightly rotated and take up
        // some space on the very right
        this._calculateDefaultRadius();
    }

    @action _calculateAntibioticLabelRowHeight() {
        if (this._antibioticLabelDimensions.size !== this.sortedAntibiotics.length) return;
        this.antibioticLabelRowHeight = Array
            .from(this._antibioticLabelDimensions.values())
            .reduce((previous, item) => Math.max(previous, item.height), 0);
        log('antibioticLabelRowHeight is %d', this.antibioticLabelRowHeight);
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
            const newKey = key instanceof SubstanceClass ? this._substanceClasses.get(key.id) : key;
            result.set(newKey, value);
        });
        return result;
    }

    /**
     * Returns width of all visible antibiotics (corresponds to position.right of the right-most
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
        if (!boundingBox) return;
        if (
            this._dimensions && this._dimensions.height === boundingBox.height &&
            this._dimensions.width === boundingBox.width) return;
        this._dimensions = {
            height: boundingBox.height,
            width: boundingBox.width,
        };
        this._calculateDefaultRadius();
    }


    /**
    * Set defaultRadius for resistances as soon as all necessary measurements are available.
    * Radius must be calculated independent of visible antibiotics; it should not change when
    * something becomes visible or not.
    */
    @action _calculateDefaultRadius() {
        // Bacteria not ready or labels not fully measured
        if (!this._bacteria.size || this._bacteriaLabelWidths.size !== this._bacteria.size) return;
        if (!this._dimensions) return;
        if (this.antibioticLabelRowHeight === undefined) return;
        log('Calculate default radius');
        const numberOfAntibiotics = this._antibiotics.size;
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
            this._dimensions.width,
        );
        // Available space: Width - widest label - first space (right of label) - space taken up
        // by right-most antibiotic
        const availableSpace = this._dimensions.width - this.space -
            this.bacteriumLabelColumnWidth - this.antibioticLabelRowHeight;
        const whitespace = (numberOfAntibiotics + numberOfSubstanceClassChanges) * this.space;
        // Radius: Don't go below 0, always be an int.
        let radius = Math.floor((availableSpace - whitespace) / numberOfAntibiotics / 2);
        radius = Math.max(radius, 1);
        // Make sure bubbles don't grow too large – even if there is a lot of matrix space
        // available. Necessary to prevent huge bubbles with small data sets, e.g. VET)
        radius = Math.min(radius, 25);
        this.defaultRadius = radius;
        log(
            'Available space: %d. Whitespace: %d. Default radius %d.',
            availableSpace,
            whitespace,
            this.defaultRadius,
        );
    }







    @action addBacterium(bacterium) {
        this._bacteria.set(bacterium.id, new BacteriumMatrixView(bacterium, this));
    }

    @action removeBacterium(bacterium) {
        this._bacteria.delete(bacterium.id);
    }

    /**
    * Returns bacteria, sorted A->Z
    * @param {Array}        Array of bacteria, sorted
    */
    @computed get sortedBacteria() {
        return Array.from(this._bacteria.values()).sort((a, b) => (
            a.bacterium.name < b.bacterium.name ? -1 : 1
        ));
    }

    @computed get sortedVisibleBacteria() {
        return this.sortedBacteria.filter(item => item.visible);
    }



    getBacteriumView(bacterium) {
        return this._bacteria.get(bacterium.id);
    }

    @action setBacteriumLabelWidth(bacterium, width) {
        log('Set width of bacteriumLabel %o to %d', bacterium, width);
        // Unchanged
        if (
            this._bacteriaLabelWidths.has(bacterium) &&
            this._bacteriaLabelWidths.get(bacterium) === width) return;
        this._bacteriaLabelWidths.set(bacterium, width);
        log('Set width of %o to %o', bacterium, width);
        this._calculateBacteriumLabelColumnWidth();
        this._calculateDefaultRadius();
    }

    @action _calculateBacteriumLabelColumnWidth() {
        if (this._bacteriaLabelWidths.size !== this.sortedBacteria.length) return;
        this.bacteriumLabelColumnWidth = Math.ceil(Array.from(this._bacteriaLabelWidths.values())
            .reduce((prev, item) => Math.max(prev, item), 0));
        log('bacteriumLabelColumnWidth is %d', this.bacteriumLabelColumnWidth);
    }

    /**
    * Return y positions for bacteria (not including the column labels on top of the matrix). See
    * get xPositions.get
    *
    * @ returns {Map}       Key: bacterium, value: Object with top
    */
    @computed get yPositions() {
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

