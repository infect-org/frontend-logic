import test from 'tape';
import calculateXPositions from './calculateXPositions';

function createSubstanceClass(parent, expanded = true, id = Math.random(), ) {
	const obj = {
		id: id
		, expanded: expanded
	};
	if (parent) obj.parent = parent;
	return obj;
}

// Create fake instances of AntibioticMatrixView
function createAntibiotic(substanceClass, visible = true, id = Math.random()) {
	const obj = {
		id: id
		, visible: visible
		, antibiotic: {
			substanceClass: substanceClass
			, getSubstanceClasses: function() {
				const classes = [substanceClass];
				while (classes.slice(-1)[0].parent) {
					classes.push(classes.slice(-1)[0].parent);
				}
				return classes;
			}
		}
	};
	return obj;
} 


function setupData() {

	// Parent not contracted
	const sc1 = createSubstanceClass();
	const sc2 = createSubstanceClass(sc1);
	const sc3 = createSubstanceClass(sc1, false);
	// Parent contracted
	const sc4 = createSubstanceClass(undefined, false, 'parent-cont');
	const sc5 = createSubstanceClass(sc4, false, 'child-with-parent-cont');

	const ab1 = createAntibiotic(sc1);
	const ab2 = createAntibiotic(sc1, false);
	const ab3 = createAntibiotic(sc1);
	const ab4 = createAntibiotic(sc2, false);
	const ab5 = createAntibiotic(sc2);
	const ab6 = createAntibiotic(sc3);
	const ab7 = createAntibiotic(sc4);
	const ab8 = createAntibiotic(sc5);

	return {
		substanceClasses: [sc1, sc2, sc3, sc4, sc5]
		, antibiotics: [ab1, ab2, ab3, ab4, ab5, ab6, ab7, ab8]
	};

}



test('calculates x positions correctly (not contracted)', (t) => {
	const data = setupData();
	const xPos = calculateXPositions(data.antibiotics.slice(0,6), 20, 2, 5);

	// Size: 6 ab - 2 hidden + 3 sClasses
	t.equal(xPos.size, 7);

	t.deepEqual(xPos.get(data.substanceClasses[0]), { left: 2, right: 94 });
	t.deepEqual(xPos.get(data.antibiotics[0]), { left: 4, right: 24 });
	t.deepEqual(xPos.get(data.antibiotics[2]), { left: 26, right: 46 });
	
	t.deepEqual(xPos.get(data.substanceClasses[1]), { left: 48, right: 70 });
	t.deepEqual(xPos.get(data.antibiotics[4]), { left: 50, right: 70 });

	t.deepEqual(xPos.get(data.substanceClasses[2]), { left: 72, right: 94 });
	t.deepEqual(xPos.get(data.antibiotics[5]), { left: 74, right: 94 });

	t.end();
});


test('calculates x positions correctly (for contracted substance classes)', (t) => {

	const data = setupData();
	const ab = data.antibiotics.slice(6,8).concat(data.antibiotics.slice(0,6));
	const xPos = calculateXPositions(ab, 20, 2, 5);

	t.deepEqual(xPos.get(data.substanceClasses[3]), { left: 2, right: 24 });
	t.equal(xPos.get(data.substanceClasses[4]), undefined);
	t.equal(xPos.get(data.substanceClasses[0]).left, 26);

	t.end();
});




