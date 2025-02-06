export default class Chord {
    static CHORD_TYPES = {
        'major': [0, 4, 7],
        'minor': [0, 3, 7],
        'diminished': [0, 3, 6],
        'augmented': [0, 4, 8],
        '7': [0, 4, 7, 10],
        'maj7': [0, 4, 7, 11],
        'm7': [0, 3, 7, 10]
    };

    constructor(root, type) {
        this.root = root;
        this.type = type;
        this.notes = this.buildChord();
    }

    buildChord() {
        const intervals = Chord.CHORD_TYPES[this.type] || Chord.CHORD_TYPES['major'];
        return intervals.map(interval => this.root + interval);
    }

    static get availableTypes() {
        return Object.keys(Chord.CHORD_TYPES);
    }
}
