import test from 'tape';
import Antibiotic from '../antibiotics/antibiotic';
import SubstanceClass from '../antibiotics/substanceClass';
import sortAntibiotics from './sortAntibiotics';


test('does not modify original data', (t) => {

	const sc1 = new SubstanceClass(1, 'sc-5');

	const antibiotics = [
		  new Antibiotic(1, 'ab-2', sc1)
		, new Antibiotic(2, 'ab-1', sc1)
	];

	sortAntibiotics(antibiotics);
	t.equals(antibiotics[0].name, 'ab-2');
	t.equals(antibiotics[1].name, 'ab-1');
	t.end();

});


test('returns correctly sorted antibiotics', (t) => {

	const sc1 = new SubstanceClass(1, 'sc-5');
	const sc2 = new SubstanceClass(2, 'sc-3', sc1);
	const sc3 = new SubstanceClass(3, 'sc-1');
	const sc4 = new SubstanceClass(4, 'sc-9', sc3);

	const antibiotics = [
		  new Antibiotic(1, 'ab-1', sc1)
		, new Antibiotic(2, 'ab-2', sc1)
		, new Antibiotic(3, 'ab-4', sc2)
		, new Antibiotic(4, 'ab-3', sc2)
		, new Antibiotic(5, 'ab-5', sc3)
		, new Antibiotic(6, 'ab-6', sc4)
	];

	const result = sortAntibiotics(antibiotics);
	t.deepEqual(result, [
		  antibiotics[4]
		, antibiotics[5]
		, antibiotics[0]
		, antibiotics[1]
		, antibiotics[3]
		, antibiotics[2]
	]);

	t.end();

});



test('respects manual sort order on substance classes', (t) => {

	const sc1 = new SubstanceClass(1, 'sc-5', undefined, { order: 1 });
	const sc2 = new SubstanceClass(2, 'sc-3-a', sc1, { order: 5 });
	const sc3 = new SubstanceClass(3, 'sc-3-z', sc1, { order: 0 });
	const sc4 = new SubstanceClass(4, 'sc-1');
	const sc5 = new SubstanceClass(5, 'sc-9', sc3);

	const antibiotics = [
		  new Antibiotic(2, 'ab-x', sc2)
		, new Antibiotic(3, 'ab-y', sc3)
		, new Antibiotic(4, 'ab-w', sc4)
		, new Antibiotic(5, 'ab-v', sc5)
		, new Antibiotic(1, 'ab-z', sc1)
	];

	const result = sortAntibiotics(antibiotics);
	t.deepEqual(result, [
		  antibiotics[4]
		, antibiotics[1]
		, antibiotics[3]
		, antibiotics[0]
		, antibiotics[2]
	]);

	t.end();

});
