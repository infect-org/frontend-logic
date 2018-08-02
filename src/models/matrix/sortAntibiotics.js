/**
* Returns sorted antibiotics; sort order:
* - sort by order field on substanceClass
* - sort alphabetically by substanceClass; from highest (parent) to lowest;
*   antibiotics without substance classes come first
* - then sort antibiotics alphabetically within the lowest (child) class.
*
* Function is needed to calculate horizontal position of a an antibiotic and a
* resistance in the matrix.
*
* @param {Array} antibiotics		Antibiotic matrixViews
*/
export default function sortAntibiotics(antibiotics) {

	// Map with key: antibiotic, value: Array of parent class names		
	const classMap = antibiotics.reduce((previous, item) => {
		// Store substanceClasse's names, from parent to child. Use slice to not modify original.
		previous.set(item, item.getSubstanceClasses().slice(0).reverse().map((sClass => sClass.name)));
		return previous;
	}, new Map());

	const sorted = antibiotics.slice(0).sort((a, b) => {
		// Go through hierarchies of substanceClasses, top-most (parent) first
		// minClassAmount: Minimal common denominator of substance class hierarchies both antibiotics have 
		const minClassAmount = Math.min(classMap.get(a).length, classMap.get(b).length);
		let currentHierarchy = 0;
		while (currentHierarchy < minClassAmount) {

			// Get substance classes for antibiotic a and b of current level
			// Make sure we reverse the substanceClasses first as we're looking top-bottom, not buttom-up
			const aSubstanceClass = a.getSubstanceClasses().slice(0).reverse()[currentHierarchy];
			const bSubstanceClass = b.getSubstanceClasses().slice(0).reverse()[currentHierarchy];
			
			// Different substance class? 
			if (aSubstanceClass !== bSubstanceClass) {
				// One of the substanceClasses has a sort order, the other not: Prefer the one with the sort order
				if (aSubstanceClass.order !== undefined && bSubstanceClass.order === undefined) return -1;
				else if (aSubstanceClass.order === undefined && bSubstanceClass.order !== undefined) return 1;
				// Both have a sort order: Sort by sort order
				else if (aSubstanceClass.order !== undefined && bSubstanceClass.order !== undefined) {
					return aSubstanceClass.order - bSubstanceClass.order;
				}
				// None has a sort order: Sort alphabetically by substance class
				else return classMap.get(a)[currentHierarchy] < classMap.get(b)[currentHierarchy] ? -1 : 1;
			}
			// -> SubstanceClass is the same
			// There are more hierarchy levels: Go one up
			else if (currentHierarchy < minClassAmount - 1) currentHierarchy++;
			// -> All hierarchies used
			// Prefer the antibiotic with fewer class hierarchies
			else if (classMap.get(a).length != classMap.get(b).length) return classMap.get(a).length < classMap.get(b).length ? -1 : 1;
			// All the same: Sort by antibiotic name
			else return a.name < b.name ? -1 : 1;
		}
	});

	return sorted;

}