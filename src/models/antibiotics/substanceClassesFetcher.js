import Fetcher from '../../helpers/standardFetcher';
import SubstanceClass from './substanceClass';
import convertNestedSetToTree from '../../helpers/convertNestedSetToTree';
import debug from 'debug';
const log = debug('infect:SubstanceClassesFetcher');

export default class SubstanceClassesFetcher extends Fetcher {

	handleData(originalData) {

		log('Handle data %o', originalData);

		// Clone array to not modify arguments
		const data = originalData.slice(0);
		const withParents = convertNestedSetToTree(data);

		// Create virtual substance class «Beta-lactam + inhibitor»
		// TODO: Move to API
		const penicillin = withParents.find((item) => item.identifier === 'penicilline');
		const stable = withParents.find((item) => item.identifier === 
			'penicillinase-stable penicillin');
		if (!penicillin || !stable) console.error('Penicillin or stable not found, are %o and %o',
			penicillin, stable);
		const index = withParents.indexOf(stable);
		// Insert at the right place (right of stable)
		withParents.splice(index + 1, 0, {
			id: -1, // Does not conflict with existing data, must be set (see antibioticsFetcher)
			identifier: 'betalactamplusinhibitor', 
			color: null, 
			name: 'Beta-lactam + inhibitor',
			parent: penicillin,
		});

		// withParents is ordered from parent to child – we therefore don't need to test if 
		// parents are available
		// Don't use forEach as we're splicing.
		withParents.forEach((item, index) => {
			const additionalProperties = {};
			if (item.color) additionalProperties.color = item.color;
			// Sort order corresponds to order of tree created from nested set
			additionalProperties.order = index;

			const parent = item.parent ? this.store.getById(item.parent.id) : undefined;
			const substanceClass = new SubstanceClass(item.id, item.name, parent, 
				additionalProperties);
			this.store.add(substanceClass);
		});

		log('%d substance classes added to store', this.store.get().size);

	}

}