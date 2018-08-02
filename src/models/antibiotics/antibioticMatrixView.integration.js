import test from 'tape';
import Antibiotic from './antibiotic';
import SubstanceClass from './substanceClass';
import AntibioticMatrixView from './antibioticMatrixView';

test('stores antibiotic', (t) => {
	const sc = new SubstanceClass(1, 'testSC');
	const ab = new Antibiotic(1, 'testAB', sc);
	const abmv = new AntibioticMatrixView(ab);
	t.equals(abmv.antibiotic, ab);
	t.end();
});