import AbstractAudioComponent from '../abstract/AbstractAudioComponent.js';

export default class PianoRoll extends AbstractAudioComponent {
    constructor(id, options = {}) {
        super(id);
        this.options = {
            rows: 88,
            columns: 64,
            startNote: 21,
            pixelsPerStep: 30,
            stepsPerBeat: 4,
            beatsPerBar: 4,
            ...options
        };
        
        this.notes = new Map(); // Using Map for O(1) lookups
        this.playhead = 0;
        this.instrument = null;
        this.isPlaying = false;
    }

    // Note management
    addNote(row, col, length = 1, velocity = 100) {
        const id = `${row}-${col}`;
        if (!this.notes.has(id)) {
            this.notes.set(id, { row, col, length, velocity });
            this.emit('noteAdded', { row, col, length, velocity });
            return true;
        }
        return false;
    }

    removeNote(row, col) {
        const id = `${row}-${col}`;
        if (this.notes.has(id)) {
            const note = this.notes.get(id);
            this.notes.delete(id);
            this.emit('noteRemoved', note);
            return true;
        }
        return false;
    }

    updateNote(row, col, updates) {
        const id = `${row}-${col}`;
        if (this.notes.has(id)) {
            const note = this.notes.get(id);
            const updatedNote = { ...note, ...updates };
            this.notes.set(id, updatedNote);
            this.emit('noteUpdated', updatedNote);
            return true;
        }
        return false;
    }

    getNoteAt(row, col) {
        return this.notes.get(`${row}-${col}`);
    }

    getAllNotes() {
        return Array.from(this.notes.values());
    }

    // Playback
    processTick(tick) {
        const ticksPerStep = 6;
        if (tick % ticksPerStep !== 0) return;

        const previousPlayhead = this.playhead;
        this.playhead = (Math.floor(tick / ticksPerStep) % this.options.columns);

        // Notifica UI del movimento del playhead
        this.emit('playheadMoved', this.playhead);

        if (!this.instrument) return;

        try {
            // Stop notes that have ended
            this.getAllNotes().forEach(note => {
                const noteEnd = note.col + note.length;
                if (this.shouldStopNote(previousPlayhead, this.playhead, note.col, noteEnd)) {
                    const noteNumber = this.options.startNote + note.row;
                    console.log(`Stopping note ${noteNumber} at column ${this.playhead}`);
                    this.instrument.stopNote(noteNumber);
                }
            });

            // Start new notes
            this.getAllNotes().forEach(note => {
                if (note.col === this.playhead) {
                    const noteNumber = this.options.startNote + note.row;
                    console.log(`Starting note ${noteNumber} at column ${this.playhead}`);
                    this.instrument.triggerNote(
                        note.velocity,
                        note.length * 100, // durata in ms
                        noteNumber
                    );
                }
            });
        } catch (error) {
            console.error('Error in processTick:', error);
        }
    }

    shouldStopNote(prevPos, newPos, noteStart, noteEnd) {
        if (prevPos < newPos) {
            return prevPos < noteEnd && noteEnd <= newPos;
        } else {
            return noteEnd <= newPos || prevPos < noteEnd;
        }
    }

    // Transport controls
    play() {
        this.isPlaying = true;
        this.emit('transportChanged', { isPlaying: true });
    }

    stop() {
        this.isPlaying = false;
        this.playhead = 0;
        this.emit('transportChanged', { isPlaying: false });
    }

    setInstrument(instrument) {
        this.instrument = instrument;
    }

    // Required by AbstractAudioComponent
    async setup() {}
    connect() { return this; }
    disconnect() { return this; }
}
