import Fetcher from '../../helpers/standardFetcher';
import Antibiotic from './antibiotic';

export default class AntibioticsFetcher extends Fetcher {

	constructor(...args) {
		super(...args.slice(0, 4));
		this._substanceClasses = args[4];
	}

	handleData(data) {

		// Remove penicillin v and Cefuroxime Axetil (they contain no data)
		let i = data.length;
		while (i--) {
			if (data[i].identifier === 'penicillin v' || data[i].identifier === 
				'cefuroxime axetil') {
				data.splice(i, 1);
			}
		}



		// Cone data as we're modifying it
		data.forEach((item) => {

			// There are 2 special cases: amoxicillin/clavulanate and piperacillin/tazobactam
			// get a «virtual» substance class Beta-lactam + inhibitor that was programmatically
			// created in SubstanceClassFetcher
			if (item.identifier === 'amoxicillin/clavulanate' || item.identifier ===
				'piperacillin/tazobactam') {
				item.substance = [{
					substanceClass: {
						id: -1,
					}
				}];
			}

			if (item.substance.length !== 1) console.warn(`antibioticsFetcher: Compound with 
				identifier ${ item.identifier } has more or less than one substance; this is 
				not expected. Only Amoxi & Pip can contain two substances.`);

			// substance hasOne substanceClass – no need to validate data
			if (!item.substance[0].substanceClass) {
				throw new Error(`antibioticsFetcher: Substance 
					${ JSON.stringify(item.substance[0]) } has bad substanceClass data.`);
			}
			const substanceClassId = item.substance[0].substanceClass.id;

			const substanceClass = this._substanceClasses.getById(substanceClassId);
			if (!substanceClass) throw new Error(`AntibioticsFetcher: Substance class with ID 
				${ substanceClassId } not found.`);
			const antibiotic = new Antibiotic(item.id, item.name, substanceClass, {
				iv: item.intravenous,
				po: item.perOs,
				identifier: item.identifier,
			});
			this.store.add(antibiotic);
		});
	}

}