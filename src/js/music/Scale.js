export default class Scale {
    static SCALES = {
        'C major': [0, 2, 4, 5, 7, 9, 11],
        'C minor': [0, 2, 3, 5, 7, 8, 10],
        'C dorian': [0, 2, 3, 5, 7, 9, 10],
        'C phrygian': [0, 1, 3, 5, 7, 8, 10],
        'C lydian': [0, 2, 4, 6, 7, 9, 11],
        'C mixolydian': [0, 2, 4, 5, 7, 9, 10],
        'C locrian': [0, 1, 3, 5, 6, 8, 10],
        'C pentatonic': [0, 2, 4, 7, 9],
        'C blues': [0, 3, 5, 6, 7, 10]
    };

    constructor(name) {
        this.name = name;
        this.notes = Scale.SCALES[name] || Scale.SCALES['C major'];
    }

    static get availableScales() {
        return Object.keys(Scale.SCALES);
    }
}
