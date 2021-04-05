import test from 'tape';
import ResistanceMatrixView from './resistanceMatrixView';
import Resistance from './resistance';
import SubstanceClass from '../antibiotics/substanceClass';
import Antibiotic from '../antibiotics/antibiotic';
import Bacterium from '../bacteria/bacterium';
import OffsetFilters from '../filters/offsetFilters';
import resistanceTypes from './resistanceTypes.js';

function setupData(sampleSize = 1000, value = 1, matrix = {}, type = 'qualitative') {
	const antibiotic = new Antibiotic(5, 'testAB', new SubstanceClass(1, 'testSC'));
	const bacterium = new Bacterium(4, 'testBact');
	const resistance = new Resistance(
		[{ type, sampleSize, value }]
		, antibiotic
		, bacterium
	);
	const resistanceMatrixView = new ResistanceMatrixView(resistance, matrix);
	return {
		resistance
		, resistanceMatrixView
	};
}


test('returns most precise value', (t) => {
	const { resistanceMatrixView } = setupData();
	t.equals(resistanceMatrixView.mostPreciseValue.type.identifier, 'qualitative');
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

	// Add quantitative data
	resistanceMatrixView.resistance.values.push({ type: resistanceTypes.mic, sampleSize: 37 });
	t.equals(resistanceMatrixView.matchesOffsets, false);

	// Remove qualitative data (has quantitative only, which matches size offset)
	resistanceMatrixView.resistance.values.splice(0, 1);
	t.equals(resistanceMatrixView.matchesOffsets, true);

	t.end();
});


test('calculates colors', (t) => {

	// 100% susceptible
	const resistanceMatrixView1 = setupData().resistanceMatrixView;
	const backgroundExpectation = { r: 237, g: 224, b: 222, a: 1 };
	t.deepEquals(resistanceMatrixView1.backgroundColor.toRgb(), backgroundExpectation);
	t.deepEquals(resistanceMatrixView1.fontColor.toRgb(), { r: 153, g: 66, b: 51, a: 1 });
	// Check if backgroundColor was not modified by fontColor (this happened before …)
	t.deepEquals(resistanceMatrixView1.backgroundColor.toRgb(), backgroundExpectation);

	// 50% susceptible and with additional MIC data
	const { resistanceMatrixView: resistanceMatrixView2 } = setupData(1000, 0.5);
	resistanceMatrixView2.resistance.addResistanceValue({ type: 'mic', sampleSize: 500 });
	t.deepEquals(resistanceMatrixView2.backgroundColor.toRgb(), { r: 224, g: 170, b: 108, a: 1 });
	t.deepEquals(resistanceMatrixView2.fontColor.toRgb(), { r: 71, g: 40, b: 6, a: 1 });

	// Quantitative only
	const { resistanceMatrixView: resistanceMatrixView3 } = setupData(1000, 0.5, undefined, 'mic');
	t.deepEquals(resistanceMatrixView3.backgroundColor.toRgb(), { r: 225, g: 224, b: 213, a: 1 });
	t.deepEquals(resistanceMatrixView3.fontColor.toRgb(), { r: 125, g: 119, b: 58, a: 1 });

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

test('returns display value', (t) => {
	// MIC
	const { resistanceMatrixView: resistanceMatrixView1 } = setupData(1000, undefined, undefined, 'mic');
	t.is(resistanceMatrixView1.displayValue, 'MIC');
	// Source: https://github.com/infect-org/infect-frontend-logic/issues/24
	const micData = {
		"percentile": 90,
		"percentileValue": 45.6,
		"slots": {
			"rangeMin": 0,
			"rangeMax": 53.9,
			"slotSize": 2.156,
			"slotCount": 25,
			"slots": []
		}
	};
	resistanceMatrixView1.resistance.values[0].setQuantitativeData(micData);
	t.is(resistanceMatrixView1.displayValue, 45.6);

	// DD
	const { resistanceMatrixView: resistanceMatrixView2 } = setupData(1000, undefined, undefined, 'discDiffusion');
	t.is(resistanceMatrixView2.displayValue, 'DD');

	// Interpreted
	const { resistanceMatrixView: resistanceMatrixView3 } = setupData(1000, 0.6, undefined);
	t.is(resistanceMatrixView3.displayValue, 40);

	t.end();
});


test('returns most precise type\'s identifier', (t) => {
	const { resistanceMatrixView } = setupData(1000, undefined, undefined, 'mic');
	t.is(resistanceMatrixView.mostPreciseResistanceTypeIdentifier, 'mic');
	t.end();
});
