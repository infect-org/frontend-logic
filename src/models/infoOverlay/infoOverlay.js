import { observable, action } from 'mobx';
import debug from 'debug';
const log = debug('infect:InfoOverlay');

export default class GuidedTour {

	@observable visible = false;

	@action hide() {
		log('Hide');
		this.visible = false;
	}

	@action show() {
		this.visible = true;
	}

	@action toggle() {
		log('Toggle from %o', this.visible);
		this.visible = !this.visible;
	}

}