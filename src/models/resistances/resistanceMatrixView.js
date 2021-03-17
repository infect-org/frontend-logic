import color from 'tinycolor2';
import { computed } from 'mobx';
import debug from 'debug';
import getRelativeValue from '../../helpers/getRelativeValue';
import resistanceTypes from './resistanceTypes.js';

const log = debug('infect:ResistanceMatrixView');


/**
* Wrapper around a resistance that can be extended with matrix
* view specific information.
*/
export default class ResistanceMatrixView {
	
	constructor(resistance, matrix) {
		this._matrixView = matrix;
		this.resistance = resistance;
	}

	_getRelativeColorValue(value, min = 0, max = 1) {
		return min + (max - min) * value;
	}

	@computed get visible() {
		return !!(this.xPosition && this.yPosition);
	}

	@computed get mostPreciseValue() {
		return this.resistance.getValuesByPrecision()[0];
	}

	@computed get radius() {
		const min = this._matrixView.sampleSizeExtremes.min;
		// Assume all sample sizes above 1000 are good enough, see
		// https://github.com/infect-org/frontend/issues/45
		const max = 1000;
		// All sample sizes > 1000 have the same radius
		const limitedSampleSizeValue = Math.min(this.mostPreciseValue.sampleSize, 1000);
		// Use log scale; log10(0) is -Infinity, use at least 1 and max. 10
		const sampleSizeBetween1And10 = (limitedSampleSizeValue - min) / (max - min) * 9 + 1;
		const logSampleSize = Math.log10(sampleSizeBetween1And10) * (max - min) + min;
		const radius = Math.round(getRelativeValue(logSampleSize, min, max, 0.5) * 
			this._matrixView.defaultRadius);
		log('Radius for resistance %o is %d', this, radius);
		return radius;
	}

	@computed get backgroundColor() {
		const { type, value } = this.mostPreciseValue;

		// if type is MIC or discDiffusion, use gray background
		if (type === resistanceTypes.mic || type === resistanceTypes.discDiffusion) {
			return color('#E1E0D5');
		}

		// Use log scale (values < 70% don't really matter) – differentiate well between
		// 70 and 100
		// Use number between 1 and 9 for log – returns number between 0 and 1
		const logValue = Math.log10(value * 9 + 1);
		const hue = this._getRelativeColorValue(1 - logValue, 9, 98) / 360;
		const saturation = this._getRelativeColorValue(1 - value, 0.3, 1);
		const lightness = this._getRelativeColorValue(value, 0.4, 0.9);
		const backgroundColor = color.fromRatio({
			h: hue
			, s: saturation
			, l: lightness
		});
		return backgroundColor;
	}

	@computed get fontColor() {
		const fontColor = this.backgroundColor.clone();
		fontColor.darken(50);
		fontColor.saturate(20);
		return fontColor;
	}

	@computed get xPosition() {
		const abView = this._matrixView.getAntibioticView(this.resistance.antibiotic);
		return this._matrixView.xPositions.get(abView);
	}

	@computed get yPosition() {
		const bactView = this._matrixView.getBacteriumView(this.resistance.bacterium);
		return this._matrixView.yPositions.get(bactView);
	}

	@computed get matchesOffsets() {
		const offsets = this._matrixView.getOffsetFilters().filters;
		const resistance = this.mostPreciseValue;
		const matchesSize = resistance.sampleSize >= offsets.get('sampleSize').min;
		const matchesValue = resistance.value <= (1 - offsets.get('susceptibility').min);
		const isInterpreted = this.mostPreciseValue.type === resistanceTypes.qualitative;
		// DD and Mic do not contain value at the beginning (before hovering them); also, we
		// can not use traidtional susceptibility offsets. They only need to match the sampleSize
		// offset.
		if (isInterpreted) return matchesSize && matchesValue;
		else return matchesSize;
	}

	@computed get displayValue() {
		// Return percent susceptible for qualitative data
		const values = new Map([
			[
				resistanceTypes.qualitative,
				({ value }) => Math.round((1 - value) * 100),
			], [
				resistanceTypes.mic,
				resistanceValue => (resistanceValue.quantitativeData.percentileValue !== undefined ?
					resistanceValue.quantitativeData.percentileValue : 'MIC'),
			], [
				resistanceTypes.discDiffusion,
				() => 'DD',
			],
		]);
		const mostPrecise = this.mostPreciseValue;
		return values.get(mostPrecise.type)(mostPrecise);
	}

}