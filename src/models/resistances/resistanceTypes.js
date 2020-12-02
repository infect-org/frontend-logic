// Higher precision means better data.
export default {
	// Quantitative data based on MHK (microdiffusion; breakpoints are not known, data cannot
	// be interpreted)
	quantitativeMHK: {
		identifier: 'mquantitiativeMHK'
		, precision: 5
	}
	// Qualitative data (breakpoints are known, data is interpreted based on them)
	, qualitative: {
		identifier: 'qualitative'
		, precision: 10
	}
};