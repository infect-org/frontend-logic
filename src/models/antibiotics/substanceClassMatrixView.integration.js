import test from 'tape';
import SubstanceClassMatrixView from './substanceClassMatrixView';
import SubstanceClass from './substanceClass';

test('constructor', (t) => {
	const sc = new SubstanceClass(1, 'test');
	const scmv = new SubstanceClassMatrixView(sc);
	t.equals(scmv.substanceClass, sc);
	t.end();
});

test('line color', (t) => {
	const sc1 = new SubstanceClass(1, 'test-1');
	const sc2 = new SubstanceClass(2, 'test-2', sc1);
	const fakeMatrixView = {
		maxAmountOfSubstanceClassHierarchies: 2
	};
	const scmv1 = new SubstanceClassMatrixView(sc1, fakeMatrixView);
	const scmv2 = new SubstanceClassMatrixView(sc2, fakeMatrixView);
	t.equals(scmv1.lineColor.toString(), 'hsl(0, 0%, 40%)');
	t.equals(scmv2.lineColor.toString(), 'hsl(0, 0%, 70%)');
	t.end();
});