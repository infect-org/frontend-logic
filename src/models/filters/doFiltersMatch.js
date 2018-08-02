import deepEqual from 'deep-equal';


/**
* Checks an object against the the filters provided. Returns true if it matches,
* else false. If one property is filtered for by different values, a match is given if
* any one of the filters for that property matches.
* @param {Object} target
* @param {Array} originalFilters 	Array of objects as they are stored in PropertyMap 
*									with value, niceValue and property: { name, niceName }
*/
export default function doFiltersMatch(target, originalFilters) {

	if (!target || typeof target !== 'object') throw new Error(`doFiltersMatch: target must be an object, is ${ typeof target }.`);
	if (!Array.isArray(originalFilters)) throw new Error(`doFiltersMatch: originalFilters must be an array.`);

	// Clone filters as we will modify the array (remove filters that were matched)
	const filters = originalFilters.slice(0);
	while(filters.length) {

		// Filters with the same property as the current filter – only one of them must match.
		const filtersWithSameProperty = filters.filter((item) => deepEqual(item.property, filters[0].property));
		const matchesForCurrentFilter = filtersWithSameProperty.filter((item) => matches(target, item));

		// Filter does not match, return instantly
		if (matchesForCurrentFilter.length === 0) return false;

		// Remove all properties that were tested for a match, continue with next property
		filtersWithSameProperty.forEach((item) => filters.splice(filters.indexOf(item), 1));
	}
	return true;

}

function matches(target, filter) {
	return target.hasOwnProperty(filter.property.name) && target[filter.property.name] === filter.value;
}