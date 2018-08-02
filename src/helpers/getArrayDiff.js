/**
* Returns the difference between two arrays. 
* @param {Array} array1		The current array
* @param {Array} array2		The new array
* @returns {Object}			Object with properties added, removed, unchanged (each 
*							contains Arrays).
*/

export default function getArrayDiff(array1, array2) {
	return {
		added: array2.filter((item) => array1.indexOf(item) === -1)
		, removed: array1.filter((item) => array2.indexOf(item) === -1)
		, unchanged: array1.filter((item) => array2.indexOf(item) > -1)
	};
}