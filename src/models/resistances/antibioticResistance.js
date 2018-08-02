import Resistance from './resistance';
import {observable} from 'mobx';

class AntibioticResistance extends Resistance {

	constructor(...args) {
		super(...args);
	}

	setAntibiotic(antibiotic) {
		this.antibiotic = antibiotic;
	}

}

export default AntibioticResistance;