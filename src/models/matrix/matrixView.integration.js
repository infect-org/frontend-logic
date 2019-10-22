import test from 'tape';
import { observable, action } from 'mobx';
import MatrixView from './matrixView';
import Antibiotic from '../antibiotics/antibiotic';
import AntibioticMatrixView from '../antibiotics/antibioticMatrixView';
import SubstanceClassMatrixView from '../antibiotics/substanceClassMatrixView';
import SubstanceClass from '../antibiotics/substanceClass';
import Bacterium from '../bacteria/bacterium';
import Resistance from '../resistances/resistance';
import SelectedFilters from '../filters/selectedFilters';
import Store from '../../helpers/store';

function createSubstanceClass(parent, name = 'testSC', id = Math.random()) {
	return new SubstanceClass(id, name, parent);
}

function ceateAntibiotic(substanceClass, name = 'testAB', id = Math.random()) {
	return new Antibiotic(id, name, substanceClass);
}

function createBacterium(name = 'testBact', id = Math.random()) {
	return new Bacterium(id, name);
}

function createResistance(ab, bact, resistances) {
	resistances = resistances || [
		{type: 'class', value: 0.3, sampleSize: 50}
		, {type: 'import', value: 0.4, sampleSize: 100}
	];
	return new Resistance(resistances, ab, bact);
}

function createValidSet() {
	const sc1 = createSubstanceClass();
	const sc2 = createSubstanceClass(sc1);
	const sc3 = createSubstanceClass();
	const ab1 = ceateAntibiotic(sc2);
	const ab2 = ceateAntibiotic(sc2);
	const ab3 = ceateAntibiotic(sc3);
	const bact1 = createBacterium('b');
	const bact2 = createBacterium('a');
	const res1 = createResistance(ab1, bact1);
	const res2 = createResistance(ab1, bact2);
	const res3 = createResistance(ab2, bact2, [{type: 'default', value: 1, sampleSize: 59}]);
	const matrix = new MatrixView();

	const abStore = new Store();
	abStore.add(ab1);
	abStore.add(ab2);
	abStore.add(ab3);
	const bactStore = new Store();
	bactStore.add(bact1);
	bactStore.add(bact2);
	const resStore = new Store([], () => Math.random());
	resStore.add(res1);
	resStore.add(res2);
	resStore.add(res3);

	matrix.setSelectedFilters(new SelectedFilters());
	
	return {
		matrix: matrix
		, antibiotics: [ab1, ab2, ab3]
		, bacteria: [bact1, bact2]
		, substanceClasses: [sc1, sc2, sc3]
		, resistances: [res1, res2, res3]
		, stores: {
			antibiotics: abStore
			, bacteria: bactStore
			, resistances: resStore
		}
		, resolveAllPromises: function() {
			['antibiotics', 'bacteria', 'resistances'].forEach((item) => {
				this.stores[item].setFetchPromise(new Promise((resolve) => resolve()));
			});			
		}
	};
}






test('setupDataWatchers watches data and adds it when ready', (t) => {
	const set = createValidSet();
	set.matrix.setupDataWatchers(set.stores.antibiotics, set.stores.bacteria, set.stores.resistances);
	// Entities are not set before they are available
	t.equals(set.matrix.antibiotics.length, 0);
	t.equals(set.matrix.sortedBacteria.length, 0);
	t.equals(set.matrix.resistances.length, 0);
	set.resolveAllPromises();
	// Data is set when promises are resolved
	setTimeout(() => {
		t.equals(set.matrix.antibiotics.length, 3);
		t.equals(set.matrix.sortedBacteria.length, 2);
		t.equals(set.matrix.resistances.length, 3);
		t.end();
	}, 20);
});


test('clears resistances before new ones are added', (t) => {
	const set = createValidSet();
	set.matrix.setupDataWatchers(set.stores.antibiotics, set.stores.bacteria, set.stores.resistances);
	set.resolveAllPromises();
	set.stores.resistances.clear();
	set.stores.resistances.add(set.resistances[0]);
	let resolver;
	set.stores.resistances.setFetchPromise(new Promise((resolve) => resolver = resolve));
	setTimeout(() => {
		resolver();
		t.equals(set.matrix.resistances.length, 1);
		t.end();
	}, 5);
});


test('fails if duplicate antibiotics are added', (t) => {
	const sc = createSubstanceClass();
	const ab1 = ceateAntibiotic(sc, 'test1', 1);
	const ab2 = ceateAntibiotic(sc, 'test2', 1);
	const matrix = new MatrixView();
	matrix.addAntibiotic(ab1);
	t.throws(() => matrix.addAntibiotic(ab2), /duplicate/);
	t.end();
});


test('sets and returns antibiotics and substanceClasses', (t) => {

	const { matrix, antibiotics, substanceClasses } = createValidSet();
	matrix.addAntibiotic(antibiotics[0]);
	matrix.addAntibiotic(antibiotics[1]);
	matrix.addAntibiotic(antibiotics[2]);	

	// Antibiotics
	t.equals(Array.isArray(matrix.antibiotics), true);
	t.equals(matrix.antibiotics.length, 3);
	t.equals(matrix.antibiotics[0] instanceof AntibioticMatrixView, true);
	t.equals(matrix.antibiotics[0].antibiotic, antibiotics[0]);
	t.equals(matrix.getAntibioticView(antibiotics[0]).antibiotic, antibiotics[0]);

	// SubstanceClasses
	t.equals(Array.isArray(matrix.substanceClasses), true);
	t.equals(matrix.substanceClasses.length, 3);
	// Classes are sorted bottom-up, see Antibiotic
	t.equals(matrix.substanceClasses[0].substanceClass, substanceClasses[1]);

	t.end();

});



test('sorts bacteria', (t) => {
	const set = createValidSet();
	const { matrix } = set;
	set.bacteria.forEach((bact) => matrix.addBacterium(bact));
	t.equal(matrix.sortedBacteria[0].bacterium.name, 'a');
	t.end();
});


test('returns height of visible bacteria', (t) => {
    const set = createValidSet();

    // We need bacteria, antibiotics and their dimensions to calculate defaultRadius, which is
    // needed to calculate width.
    set.antibiotics.forEach(ab => set.matrix.addAntibiotic(ab));
    set.bacteria.forEach(bact => set.matrix.addBacterium(bact));
    set.bacteria.forEach(bact => set.matrix.setBacteriumLabelWidth(bact, 20));
    set.antibiotics.forEach(ab => set.matrix.setAntibioticLabelDimensions(ab, 10, 10));

    // Dimensions are needed to calculate real positions
    set.matrix.setDimensions({ height: 100, width: 100 });
    // 30: Not manually calculated, used return value
    t.is(set.matrix.visibleBacteriaHeight, 30);

    t.end();
});


/*test('only returns visible bacteria for sortedVisibleBacteria', (t) => {
	const set = createValidSet();
	const {matrix} = set;
	matrix.selectedFilters.addFilter({
		value: 'a'
		, niceValue: 'a'
		, property: {
			entityType: 'bacterium'
			, name: 'name'
			, niceName: 'Name'
		}
	});
	t.equal(matrix.sortedVisibleBacteria.length, 1);
	t.end();
});*/


test('adds, removes and returns bacteria', (t) => {
	const set = createValidSet();
	const {matrix, bacteria} = set;
	matrix.addBacterium(bacteria[0]);
	matrix.addBacterium(bacteria[1]);
	matrix.removeBacterium(bacteria[0]);
	t.equal(matrix.sortedBacteria.length, 1);
	t.equal(matrix.getBacteriumView(bacteria[1]).bacterium, bacteria[1]);
	t.end();
});

test('calculates antibiotic label row height when all antibiotic dimensions are set', (t) => {
	const set = createValidSet();
	const {matrix} = set;
	set.bacteria.forEach((bact) => matrix.addBacterium(bact));
	set.antibiotics.forEach((ab) => matrix.addAntibiotic(ab));
	matrix.setAntibioticLabelDimensions(set.antibiotics[0], 50, 20);
	matrix.setAntibioticLabelDimensions(set.antibiotics[1], 50, 60);
	matrix.setAntibioticLabelDimensions(set.antibiotics[2], 50, 40);
	t.equal(matrix.antibioticLabelRowHeight, 60);
	t.end();
});


test('calculates y positions', (t) => {
	const set = createValidSet();
	const {matrix} = set;
	set.bacteria.forEach((bact) => matrix.addBacterium(bact));
	set.antibiotics.forEach((ab) => matrix.addAntibiotic(ab));
	matrix.space = 20;
	matrix.setDimensions({width: 350, height: 100});
	// Width of label must be set so that defaultRadius can be calculated
	// which is needed for yPositions
	matrix.setBacteriumLabelWidth(set.bacteria[0], 20);
	matrix.setBacteriumLabelWidth(set.bacteria[1], 100);
	matrix.setAntibioticLabelDimensions(set.antibiotics[0], 0, 0);
	matrix.setAntibioticLabelDimensions(set.antibiotics[1], 0, 0);
	matrix.setAntibioticLabelDimensions(set.antibiotics[2], 0, 0);
	t.deepEqual(matrix.yPositions.get(matrix.sortedBacteria[0]), {top: 0});
	t.deepEqual(matrix.yPositions.get(matrix.sortedBacteria[1]), {top: 70});
	t.end();
});

test('calculates bacterium label column width', (t) => {
	const set = createValidSet();
	const {matrix} = set;
	set.bacteria.forEach((bact) => matrix.addBacterium(bact));
	set.antibiotics.forEach((ab) => matrix.addAntibiotic(ab));
	matrix.setDimensions({width: 351.5, height: 200});
	matrix.setBacteriumLabelWidth(set.bacteria[0], 20);
	matrix.setBacteriumLabelWidth(set.bacteria[1], 5);
	t.equal(matrix.bacteriumLabelColumnWidth, 20);
	t.end();
});


test('calculates radius', (t) => {

	const set = createValidSet();
	const {matrix} = set;

	t.equal(matrix.defaultRadius, undefined);
	set.bacteria.forEach((bact) => matrix.addBacterium(bact));
	set.antibiotics.forEach((ab) => matrix.addAntibiotic(ab));
	matrix.setDimensions({width: 401.5, height: 200});
	matrix.space = 20;
	matrix.setBacteriumLabelWidth(set.bacteria[0], 50);
	matrix.setBacteriumLabelWidth(set.bacteria[1], 100);
	matrix.setAntibioticLabelDimensions(set.antibiotics[0], 20, 50);
	matrix.setAntibioticLabelDimensions(set.antibiotics[1], 0, 30);
	matrix.setAntibioticLabelDimensions(set.antibiotics[2], 30, 20);
	t.equal(matrix.defaultRadius, 25);

	// Don't go negative
	matrix.setDimensions({width: 100, height: 100});
	t.equal(matrix.defaultRadius, 1);

	t.end();
});




test('antibiotic functions', (t) => {

	const set = createValidSet();
	set.antibiotics.forEach((ab) => set.matrix.addAntibiotic(ab));

	// sorted
	t.equal(set.matrix.sortedAntibiotics.length, 3);
	set.matrix.sortedAntibiotics.forEach((item) => {
		t.equal(item instanceof AntibioticMatrixView, true);
	});

	const xPos = set.matrix.xPositions;
	// Don't test for real values (x/y positions), just if all entities are there
	// xPos: 1 entry for every ab/sc
	t.equal(xPos.size, 6);
	// 3 entries for antibiotic, 3 for substanceClass
	t.equal(Array.from(xPos.keys()).filter((item) => item instanceof AntibioticMatrixView).length, 3);
	t.equal(Array.from(xPos.keys()).filter((item) => item instanceof SubstanceClassMatrixView).length, 3);

	t.end();

});



test('returns width of visible antibiotics', (t) => {

    const set = createValidSet();

    // We need bacteria, antibiotics and their dimensions to calculate defaultRadius, which is
    // needed to calculate width.
    set.antibiotics.forEach(ab => set.matrix.addAntibiotic(ab));
    set.bacteria.forEach(bact => set.matrix.addBacterium(bact));
    set.bacteria.forEach(bact => set.matrix.setBacteriumLabelWidth(bact, 20));
    set.antibiotics.forEach(ab => set.matrix.setAntibioticLabelDimensions(ab, 10, 10));

    // Dimensions are needed to calculate real positions
    set.matrix.setDimensions({ height: 100, width: 100 });
    // 69: Not manually calculated, used return value
    t.is(set.matrix.visibleAntibioticsWidth, 69);

    t.end();

});




test('max amount of substance class hierarchies', (t) => {
	const set = createValidSet();
	set.antibiotics.forEach((ab) => set.matrix.addAntibiotic(ab));
	t.equal(set.matrix.maxAmountOfSubstanceClassHierarchies, 2);
	t.end();
});

test('substance class label height', (t) => {
	const set = createValidSet();
	const { matrix, substanceClasses } = set;
	set.bacteria.forEach((bact) => matrix.addBacterium(bact));
	set.antibiotics.forEach((ab) => matrix.addAntibiotic(ab));
	t.equal(matrix.greatestSubstanceClassLabelHeight, undefined);
	matrix.setSubstanceClassHeight(substanceClasses[0], 5);
	matrix.setSubstanceClassHeight(substanceClasses[1], 9);
	matrix.setSubstanceClassHeight(substanceClasses[2], 2);
	t.equal(matrix.greatestSubstanceClassLabelHeight, 9);
	t.end();
});



test('updates sample size extremes', (t) => {
	const set = createValidSet();
	const {matrix} = set;
	set.matrix.setupDataWatchers(set.stores.antibiotics, set.stores.bacteria, set.stores.resistances);
	set.resolveAllPromises();
	setTimeout(() => {
		t.deepEqual(matrix.sampleSizeExtremes, { min: 59, max: 100 });
		t.end();
	});
});



test('active resistance', (t) => {
	const set = createValidSet();
	const {matrix, resistances} = set;
	matrix.setActiveResistance(resistances[0]);
	t.equals(matrix.activeResistance, resistances[0]);
	matrix.setActiveResistance();
	t.equals(matrix.activeResistance, undefined);
	t.end();
});



