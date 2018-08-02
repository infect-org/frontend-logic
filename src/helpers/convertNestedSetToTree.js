/**
* Converts a nested set into a tree
* @param {object[]} set
* @returns {object[]}		Same as param set passed, but
* 							- left/right properties removed
* 							- 
*/
export default function convertNestedSetToTree(set) {

	// Contains objects with properties: item (item) and right (right property of item)
	let parents = [];

	return [...set]
		.sort((a, b) => a.left - b.left)
		.map((item) => {
			// clonedItem is a copy of item minus left and right properties
			const { left, right, ...clonedItem } = item; // eslint-disable-line
			// If left property of current item is > right property of last item 
			// in parents: remove parents' last item
			parents = parents.filter((parent) => parent.right > item.right);
			// Add parent as long as we have parents available
			if (parents.length) clonedItem.parent = parents[parents.length - 1].item;
			// If item is a parent (right > left+1), push to parents
			if (item.right > item.left + 1) parents.push({ item: clonedItem, right: item.right });
			return clonedItem;
		});

}