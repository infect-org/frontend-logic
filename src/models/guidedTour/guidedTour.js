import { observable, action } from 'mobx';
import debug from 'debug';
const log = debug('infect:GuidedTour');

export default class GuidedTour {

	/**
	* @param {InfoOverlay} infoOverlay			Reference to the info overlay model (overlay must be
	*											closed when guided tour is displayed)
	*/
	constructor(infoOverlay) {
		this.infoOverlay = infoOverlay;
	}

	@observable started = false;

	@action start() {
		log('Start guided tour, hide infoOverlay');
		this.started = true;
		this.infoOverlay.hide();
	}

	@action end() {
		log('End');
		this.started = false;
	}

}