// Higher precision means better data.
export default Object.freeze({
    // Quantitative data for disc diffusion
    discDiffusion: {
        identifier: 'discDiffusion',
        precision: 4,
    },
    // Quantitative data based on MIC (micro dilution)
    mic: {
        identifier: 'mic',
        precision: 5,
    },
    // Qualitative data (breakpoints are known, data is interpreted based on them)
    qualitative: {
        identifier: 'qualitative',
        precision: 10,
    },
});
