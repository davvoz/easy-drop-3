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
            const note = { row, col, length, velocity };
            if (this.validateNote(note)) {
                this.notes.set(id, note);
                this.emit('noteAdded', note);
                return true;
            }
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

        // Rimuoviamo il controllo isPlaying qui perché lo gestiamo già nel metodo play()
        if (!this.instrument) return;

        try {
            const currentNotes = this.getAllNotes();
            
            // Stop notes that have ended
            currentNotes.forEach(note => {
                const noteEnd = note.col + (note.length || 1);
                if (this.shouldStopNote(previousPlayhead, this.playhead, note.col, noteEnd)) {
                    const noteNumber = this.options.startNote + note.row;
                    if (this.instrument && typeof this.instrument.stopNote === 'function') {
                        this.instrument.stopNote(noteNumber);
                    }
                }
            });

            // Start new notes at current playhead position
            currentNotes
                .filter(note => note.col === this.playhead)
                .forEach(note => {
                    if (!this.instrument || typeof this.instrument.triggerNote !== 'function') return;
                    
                    const noteNumber = this.options.startNote + note.row;
                    const velocity = Math.max(1, Math.min(127, note.velocity || 100));
                    const duration = Math.max(100, (note.length || 1) * 100);
                    
                    this.instrument.triggerNote(velocity, duration, noteNumber);
                    console.log('Playing note:', { noteNumber, velocity, duration });
                });
        } catch (error) {
            console.error('Error in processTick:', error);
        }
    }

    shouldStopNote(prevPos, newPos, noteStart, noteEnd) {
        // Aggiungiamo controlli di validità
        if (typeof prevPos !== 'number' || typeof newPos !== 'number' || 
            typeof noteStart !== 'number' || typeof noteEnd !== 'number') {
            return false;
        }

        if (prevPos < newPos) {
            // Playhead si muove in avanti normalmente
            return prevPos < noteEnd && noteEnd <= newPos;
        } else {
            // Playhead è tornato all'inizio
            return noteEnd <= newPos || prevPos < noteEnd;
        }
    }

    // Aggiungiamo un metodo helper per validare le note
    validateNote(note) {
        return note && 
               typeof note.row === 'number' && 
               typeof note.col === 'number' && 
               note.row >= 0 && 
               note.col >= 0 && 
               (note.length || 1) > 0 && 
               (note.velocity || 100) > 0;
    }

    // Transport controls
    play() {
        if (!this.instrument) {
            console.warn('No instrument set for piano roll');
            return;
        }
        this.isPlaying = true;
        this.emit('transportChanged', { isPlaying: true });
    }

    stop() {
        this.isPlaying = false;
        this.playhead = 0;
        
        // Stop all playing notes when stopping
        if (this.instrument && typeof this.instrument.stopAllNotes === 'function') {
            this.instrument.stopAllNotes();
        }
        
        this.emit('transportChanged', { isPlaying: false });
    }

    setInstrument(instrument) {
        if (!instrument) {
            console.warn('Invalid instrument provided');
            return;
        }
        
        // Stop any playing notes before switching instrument
        if (this.instrument && typeof this.instrument.stopAllNotes === 'function') {
            this.instrument.stopAllNotes();
        }
        
        this.instrument = instrument;
        console.log('Instrument set:', instrument);
    }

    // Required by AbstractAudioComponent
    async setup() {}
    connect() { return this; }
    disconnect() { return this; }

    setBeatsPerBar(beats) {
        if (typeof beats !== 'number' || beats < 1) {
            console.warn('Invalid beats value');
            return;
        }

        const oldBeats = this.options.beatsPerBar;
        this.options.beatsPerBar = beats;

        // Ricalcola le colonne mantenendo lo stesso numero di battute
        const currentBars = Math.ceil(this.options.columns / (this.options.stepsPerBeat * oldBeats));
        const newColumns = currentBars * this.options.stepsPerBeat * beats;
        
        // Assicurati che ci siano abbastanza colonne per tutti i beats
        this.options.columns = Math.max(newColumns, beats * this.options.stepsPerBeat * 4); // minimo 4 battute
        
        // Aggiorna la posizione del playhead se necessario
        this.playhead = Math.min(this.playhead, this.options.columns - 1);
        
        this.emit('beatsChanged', {
            beats,
            columns: this.options.columns,
            bars: currentBars
        });
    }

    setPlayhead(position) {
        // Ensure position is within bounds
        this.playhead = Math.max(0, Math.min(position, this.options.columns - 1));
        
        // Stop any currently playing notes
        if (this.instrument && typeof this.instrument.stopAllNotes === 'function') {
            this.instrument.stopAllNotes();
        }
        
        this.emit('playheadMoved', this.playhead);
    }
}
