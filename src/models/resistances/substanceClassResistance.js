import Resistance from './resistance';
import {observable} from 'mobx';

class SubstanceClassResistance extends Resistance {

	constructor(...args) {
		super(...args);
	}

	setSubstanceClass(substanceClass) {
		this.substanceClass = substanceClass;
	}

}

export default SubstanceClassResistance;