import test from 'tape';
import ResistanceMatrixView from './resistanceMatrixView';
import Resistance from './resistance';
import SubstanceClass from '../antibiotics/substanceClass';
import Antibiotic from '../antibiotics/antibiotic';
import Bacterium from '../bacteria/bacterium';
import OffsetFilters from '../filters/offsetFilters';

function setupData(sampleSize = 1000, value = 1, matrix = {}) {
	const resistance = new Resistance(
		[{ type: 'import', sampleSize: sampleSize, value: value }]
		, new Antibiotic(5, 'testAB', new SubstanceClass(1, 'testSC'))
		, new Bacterium(4, 'testBact')
	);
	const resistanceMatrixView = new ResistanceMatrixView(resistance, matrix);
	return {
		resistance
		, resistanceMatrixView
	};
}


test('returns most precise value', (t) => {
	const { resistanceMatrixView } = setupData();
	t.equals(resistanceMatrixView.mostPreciseValue.type.identifier, 'importResistance');
	t.end(); 
});


test('respects offset filters', (t) => {
	const matrix = {
		offsetFilters: new OffsetFilters()
		, getOffsetFilters: function() {
			return this.offsetFilters;
		}
	};
	matrix.offsetFilters.setFilter('sampleSize', 'min', 1000);
	matrix.offsetFilters.setFilter('susceptibility', 'min', 0);

	const { resistanceMatrixView } = setupData(1000, 0.8, matrix);
	t.equals(resistanceMatrixView.matchesOffsets, true);
	matrix.offsetFilters.setFilter('sampleSize', 'min', 1001);
	t.equals(resistanceMatrixView.matchesOffsets, false);
	matrix.offsetFilters.setFilter('sampleSize', 'min', 0);
	matrix.offsetFilters.setFilter('susceptibility', 'min', 0.3);
	t.equals(resistanceMatrixView.matchesOffsets, false);
	t.end();
});


test('calculates colors', (t) => {
	const resistanceMatrixView1 = setupData().resistanceMatrixView;
	const resistanceMatrixView2 = setupData(1000, 0.5).resistanceMatrixView;
	const backgroundExpectation = { r: 237, g: 224, b: 222, a: 1 };
	t.deepEquals(resistanceMatrixView1.backgroundColor.toRgb(), backgroundExpectation);
	t.deepEquals(resistanceMatrixView1.fontColor.toRgb(), { r: 153, g: 66, b: 51, a: 1 });
	// Check if backgroundColor was not modified by fontColor (this happened bevore …)
	t.deepEquals(resistanceMatrixView1.backgroundColor.toRgb(), backgroundExpectation);
	t.deepEquals(resistanceMatrixView2.backgroundColor.toRgb(), { r: 224, g: 170, b: 108, a: 1 });
	t.deepEquals(resistanceMatrixView2.fontColor.toRgb(), { r: 71, g: 41, b: 6, a: 1 });
	t.end();
});

test('calculates radius', (t) => {
	const matrix = {
		sampleSizeExtremes: { min: 100, max: 1000 }
		, defaultRadius: 20
	};
	const resistanceMatrixView1 = setupData(100, undefined, matrix).resistanceMatrixView;
	const resistanceMatrixView2 = setupData(500, undefined, matrix).resistanceMatrixView;
	const resistanceMatrixView3 = setupData(1000, undefined, matrix).resistanceMatrixView;
	const resistanceMatrixView4 = setupData(5000, undefined, matrix).resistanceMatrixView;
	t.equals(resistanceMatrixView1.radius, 10);
	t.equals(resistanceMatrixView2.radius, 17);
	t.equals(resistanceMatrixView3.radius, 20);
	// Sample sizes larger than 1000 are ignored (radius = 1000-sample-size)
	t.equals(resistanceMatrixView4.radius, 20);
	t.end();
});