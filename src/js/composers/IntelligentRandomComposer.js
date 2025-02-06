import Scale from '../music/Scale.js';
import Chord from '../music/Chord.js';

export default class IntelligentRandomComposer {
    constructor(options = {}) {
        this.options = {
            scale: 'C major',        // Scala di default
            rootNote: 60,            // Middle C
            minVelocity: 64,         // Velocity minima
            maxVelocity: 127,        // Velocity massima
            density: 0.5,            // Densità delle note (0-1)
            complexity: 0.5,         // Complessità ritmica (0-1)
            melodicRange: 24,        // Aumentiamo il range melodico a 2 ottave
            chordChance: 0.3,        // Probabilità di accordi
            syncopationLevel: 0.3,   // Livello di sincopi (0-1)
            repetitionChance: 0.4,   // Probabilità di ripetizione pattern
            grooveStrength: 0.5,     // Forza del groove (0-1)
            maxNotesPerChord: 4,        // Numero massimo di note per accordo
            rhythmicVariety: 0.5,       // Quanto varia il ritmo (0-1)
            melodicDirection: 0,        // -1: discendente, 0: misto, 1: ascendente
            harmonicComplexity: 0.5,    // Complessità degli accordi (0-1)
            swingFactor: 0,            // Quantità di swing (0-1)
            noteLengthVariety: 0.5,    // Varietà nelle durate delle note (0-1)
            arpeggioChance: 0.2,       // Probabilità di arpeggi
            scaleMode: 'normal',       // 'normal', 'pentatonic', 'blues', 'chromatic'
            rhythmicPattern: 'auto',    // 'auto', 'straight', 'dotted', 'triplet'
            // Nuove opzioni per controllo più granulare
            noteDistribution: {
                single: 0.6,    // Probabilità note singole
                chord: 0.3,     // Probabilità accordi
                arpeggio: 0.1   // Probabilità arpeggi
            },
            rhythmicSettings: {
                allowTriplets: true,
                allowDotted: true,
                minNoteLength: 4,
                maxNoteLength: 64,
                beatEmphasis: 0.8,    // Enfasi sui beat principali
                offbeatEmphasis: 0.3  // Enfasi sugli off-beat
            },
            melodicSettings: {
                direction: 'mixed',    // 'up', 'down', 'mixed'
                stepSize: 0.5,         // 0-1: probabilità di intervalli più ampi
                octaveRange: 2,        // Range in ottave
                preferredIntervals: [2, 3, 4, 7], // Intervalli preferiti
                scaleMode: 'normal'    // 'normal', 'pentatonic', 'blues', 'chromatic'
            },
            chordSettings: {
                maxVoices: 4,
                voicingStyle: 'close', // 'close', 'spread', 'random'
                inversions: true,
                extendedChords: false, // Accordi estesi (9, 11, 13)
                preferredTypes: ['major', 'minor', '7'] // Tipi di accordi preferiti
            },
            arpeggioSettings: {
                direction: 'up',       // 'up', 'down', 'random'
                speed: 1,              // Velocità relativa (0.5-2)
                range: 2,              // Range in ottave
                pattern: 'regular'     // 'regular', 'alternating', 'random'
            },
            grooveSettings: {
                pattern: 'basic',      // 'basic', 'swing', 'shuffle', 'custom'
                intensity: 0.5,        // Forza del groove
                swing: 0,              // Quantità di swing (0-1)
                accentuation: 0.3      // Forza degli accenti
            },
            variationSettings: {
                allowRepetition: true,
                repetitionFrequency: 0.4,
                mutationRate: 0.2,     // Rate di variazione delle ripetizioni
                phraseLength: 4        // Lunghezza frasi musicali in beat
            },
            ...options
        };

        this.scale = new Scale(this.options.scale);
        this.patterns = {
            rhythmic: this.generateRhythmicPatterns(),
            melodic: this.generateMelodicPatterns()
        };

        // Assicuriamoci che tutte le impostazioni necessarie siano inizializzate
        this.ensureDefaultSettings();
    }

    generatePattern(measures = 4, beatsPerMeasure = 4) {
        const notes = [];
        const totalSteps = measures * beatsPerMeasure * 16; // Aumentato a 16 steps per beat
        const groove = this.createGroovePattern(beatsPerMeasure);

        // Generiamo diversi tipi di pattern per ogni battuta
        for (let measure = 0; measure < measures; measure++) {
            const measureStartStep = measure * beatsPerMeasure * 16; // Aumentato a 16
            
            // Decidiamo il tipo di pattern per questa battuta
            const patternType = Math.random();
            
            if (patternType < 0.3) {
                this.generateMelodicMeasure(notes, measureStartStep, beatsPerMeasure, groove);
            } else if (patternType < 0.6) {
                this.generateChordMeasure(notes, measureStartStep, beatsPerMeasure, groove);
            } else {
                this.generateMixedMeasure(notes, measureStartStep, beatsPerMeasure, groove);
            }
        }

        return this.applyMusicalRefinements(notes, totalSteps);
    }

    generateMelodicMeasure(notes, startStep, beatsPerMeasure, groove) {
        const stepsPerBeat = 16; // Aumentato da 4 a 16
        const totalSteps = beatsPerMeasure * stepsPerBeat;
        
        for (let step = 0; step < totalSteps; step++) {
            const currentStep = startStep + step;
            
            if (this.shouldAddNoteAtStep(step, groove)) {
                const note = this.createSingleNote(currentStep);
                // Aggiungiamo varietà nella lunghezza delle note
                note.length = this.determineNoteLengthWithVariety(step);
                notes.push(note);
            }
        }
    }

    generateChordMeasure(notes, startStep, beatsPerMeasure, groove) {
        const stepsPerBeat = 16; // Aumentato da 4 a 16
        const totalSteps = beatsPerMeasure * stepsPerBeat;
        
        for (let beat = 0; beat < beatsPerMeasure; beat++) {
            const currentStep = startStep + (beat * stepsPerBeat);
            
            if (Math.random() < this.options.density) {
                const chordNotes = this.createChord(currentStep);
                // Aggiungiamo varietà nella lunghezza degli accordi
                const chordLength = this.determineChordLength(beat);
                chordNotes.forEach(note => {
                    note.length = chordLength;
                    notes.push(note);
                });
            }
        }
    }

    generateMixedMeasure(notes, startStep, beatsPerMeasure, groove) {
        const stepsPerBeat = 4;
        const totalSteps = beatsPerMeasure * stepsPerBeat;
        
        for (let step = 0; step < totalSteps; step++) {
            const currentStep = startStep + step;
            
            if (this.shouldAddNoteAtStep(step, groove)) {
                if (step % 4 === 0 && Math.random() < this.options.chordChance) {
                    // Aggiungi un accordo sui beat principali
                    const chordNotes = this.createChord(currentStep);
                    chordNotes.forEach(note => {
                        note.length = this.determineChordLength(Math.floor(step/4));
                        notes.push(note);
                    });
                } else {
                    // Aggiungi note melodiche
                    const note = this.createSingleNote(currentStep);
                    note.length = this.determineNoteLengthWithVariety(step);
                    notes.push(note);
                }
            }
        }
    }

    determineNoteLengthWithVariety(step) {
        const baseLengths = [4, 8, 12, 16, 24, 32, 48, 64]; // Lunghezze note aumentate
        const maxIndex = Math.floor(this.options.complexity * baseLengths.length);
        const varietyBonus = Math.floor(this.options.noteLengthVariety * 3);
        const possibleLengths = baseLengths.slice(0, maxIndex + varietyBonus);
        
        // Favorisci note più lunghe sui beat principali
        if (step % 16 === 0) { // Modificato da 4 a 16
            return possibleLengths[Math.floor(Math.random() * possibleLengths.length)];
        }
        
        // Note più corte sulle suddivisioni
        return possibleLengths[Math.floor(Math.random() * Math.min(4, possibleLengths.length))];
    }

    determineChordLength(beat) {
        // Accordi più lunghi all'inizio della battuta
        const baseLengths = [16, 32, 48, 64]; // Lunghezze accordi aumentate
        if (beat === 0) {
            return baseLengths[Math.floor(Math.random() * baseLengths.length)];
        }
        return baseLengths[Math.floor(Math.random() * 2)]; // Più corti sugli altri beat
    }

    shouldAddNoteAtStep(step, groove) {
        const baseChance = this.options.density;
        const grooveInfluence = groove[step % groove.length] * this.options.grooveStrength;
        const syncopationBonus = this.getSyncopationBonus(step);
        
        return Math.random() < (baseChance + grooveInfluence + syncopationBonus);
    }

    createNoteGroup(step) {
        const rand = Math.random();
        if (rand < this.options.arpeggioChance) {
            return this.createArpeggio(step);
        } else if (rand < this.options.arpeggioChance + this.options.chordChance) {
            return this.createChord(step);
        }
        return [this.createSingleNote(step)];
    }

    createSingleNote(step) {
        const { melodicSettings } = this.options;
        
        // Se non ci sono melodicSettings, usa valori di default
        const direction = melodicSettings?.direction === 'mixed' ? 
            (Math.random() > 0.5 ? 1 : -1) : 
            (melodicSettings?.direction === 'up' ? 1 : -1);
        
        const octaveRange = melodicSettings?.octaveRange || 2;
        const octaveOffset = Math.floor(Math.random() * (octaveRange * 2 + 1)) - octaveRange;
        
        // Usa gli intervalli preferiti se definiti, altrimenti usa intervalli di default
        const defaultIntervals = [0, 2, 3, 4, 5, 7];
        const availableIntervals = melodicSettings?.preferredIntervals || defaultIntervals;
        
        const interval = availableIntervals[
            Math.floor(Math.random() * availableIntervals.length)
        ];

        // Seleziona una nota dalla scala
        const scalePosition = Math.floor(Math.random() * this.scale.notes.length);
        const note = this.scale.notes[scalePosition] + 
                    (octaveOffset * 12) + 
                    (interval * direction);
        
        return {
            row: this.constrainToRange(note + this.options.rootNote),
            col: step,
            length: this.determineNoteLengthWithVariety(step),
            velocity: this.determineVelocity(step)
        };
    }

    createChord(step) {
        const chordNotes = [];
        const chordType = this.selectChordType();
        const baseNote = this.scale.notes[Math.floor(Math.random() * this.scale.notes.length)];
        
        const chord = new Chord(baseNote, chordType);
        const velocity = this.determineVelocity(step);

        // Aggiungi inversioni degli accordi
        const inversion = Math.floor(Math.random() * 3); // 0, 1, o 2
        let notes = chord.notes;
        for (let i = 0; i < inversion; i++) {
            notes = [...notes.slice(1), notes[0] + 12];
        }

        notes.forEach(note => {
            chordNotes.push({
                row: this.constrainToRange(note + this.options.rootNote),
                col: step,
                velocity
            });
        });

        return chordNotes;
    }

    createArpeggio(step) {
        const notes = [];
        const baseChord = this.createChord(step);
        const arpeggioLength = Math.floor(2 + Math.random() * 4);
        
        for (let i = 0; i < arpeggioLength; i++) {
            const note = baseChord[i % baseChord.length];
            notes.push({
                ...note,
                col: step + i,
                length: 1
            });
        }
        return notes;
    }

    determineNoteLength(step) {
        const baseLengths = [1, 2, 4, 8];
        const complexityIndex = Math.floor(this.options.complexity * baseLengths.length);
        const possibleLengths = baseLengths.slice(0, complexityIndex + 1);
        
        return possibleLengths[Math.floor(Math.random() * possibleLengths.length)];
    }

    determineVelocity(step) {
        const range = this.options.maxVelocity - this.options.minVelocity;
        const base = this.options.minVelocity;
        
        // Accentua i beat principali
        const isMainBeat = step % 4 === 0;
        const accentuation = isMainBeat ? 0.2 : 0;
        
        return Math.floor(base + (Math.random() * range * (1 + accentuation)));
    }

    createGroovePattern(beatsPerMeasure) {
        const stepsPerBeat = 16; // Aumentato da 4 a 16
        const pattern = new Array(beatsPerMeasure * stepsPerBeat).fill(0);
        
        // Crea un groove basico
        for (let i = 0; i < pattern.length; i++) {
            // Enfatizza i beat principali
            if (i % stepsPerBeat === 0) {
                pattern[i] = 0.8;
            }
            // Aggiungi variazioni per complessità
            else if (i % 8 === 0) { // Modificato da 2 a 8
                pattern[i] = 0.5;
            }
            else if (i % 4 === 0) { // Modificato
                pattern[i] = 0.3;
            }
            else {
                pattern[i] = 0.2;
            }
        }

        return pattern;
    }

    getSyncopationBonus(step) {
        // Aumenta la probabilità su beat sincopati
        const isSync = step % 16 !== 0 && step % 8 !== 0; // Modificato per il nuovo grid
        return isSync ? this.options.syncopationLevel * 0.3 : 0;
    }

    constrainToRange(note) {
        // Limitiamo le note al range MIDI valido (0-127)
        return Math.min(Math.max(note, 0), 127);
    }

    selectChordType() {
        const types = ['major', 'minor', 'diminished', 'augmented', '7', 'maj7', 'm7'];
        return types[Math.floor(Math.random() * types.length)];
    }

    generateRhythmicPatterns() {
        return {
            basic: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
            offbeat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
            syncopated: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
            triplet: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
            dotted: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            dense: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
            sparse: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]
        };
    }

    generateMelodicPatterns() {
        return {
            ascending: [0, 2, 4, 5, 7, 9, 11, 12],
            descending: [12, 11, 9, 7, 5, 4, 2, 0],
            arpeggios: [0, 4, 7, 12, 7, 4, 0]
        };
    }

    applyMusicalRefinements(notes, totalSteps) {
        // Applica ripetizioni dove appropriato
        if (Math.random() < this.options.repetitionChance) {
            const patternLength = Math.floor(totalSteps / 2);
            const pattern = notes.filter(n => n.col < patternLength);
            
            pattern.forEach(note => {
                notes.push({
                    ...note,
                    col: note.col + patternLength
                });
            });
        }

        // Ordina le note per posizione
        return notes.sort((a, b) => a.col - b.col);
    }

    // Metodi di utilità per impostare le opzioni
    setScale(scale) {
        this.options.scale = scale;
        this.scale = new Scale(scale);
        return this;
    }

    setDensity(density) {
        this.options.density = Math.max(0, Math.min(1, density));
        return this;
    }

    setComplexity(complexity) {
        this.options.complexity = Math.max(0, Math.min(1, complexity));
        return this;
    }

    // Aggiungiamo nuovi metodi di configurazione fluent
    setSwing(amount) {
        this.options.swingFactor = Math.max(0, Math.min(1, amount));
        return this;
    }

    setArpeggioChance(chance) {
        this.options.arpeggioChance = Math.max(0, Math.min(1, chance));
        return this;
    }

    setScaleMode(mode) {
        this.options.scaleMode = mode;
        return this;
    }

    setRhythmicPattern(pattern) {
        this.options.rhythmicPattern = pattern;
        return this;
    }

    setHarmonicComplexity(complexity) {
        this.options.harmonicComplexity = Math.max(0, Math.min(1, complexity));
        return this;
    }

    // Nuovi metodi per configurazione
    setNoteDistribution(distribution) {
        if (this.validateDistribution(distribution)) {
            this.options.noteDistribution = { ...this.options.noteDistribution, ...distribution };
        }
        return this;
    }

    setRhythmicSettings(settings) {
        this.options.rhythmicSettings = { ...this.options.rhythmicSettings, ...settings };
        return this;
    }

    setMelodicSettings(settings) {
        this.options.melodicSettings = { ...this.options.melodicSettings, ...settings };
        return this;
    }

    setChordSettings(settings) {
        this.options.chordSettings = { ...this.options.chordSettings, ...settings };
        return this;
    }

    setArpeggioSettings(settings) {
        this.options.arpeggioSettings = { ...this.options.arpeggioSettings, ...settings };
        return this;
    }

    setGrooveSettings(settings) {
        this.options.grooveSettings = { ...this.options.grooveSettings, ...settings };
        return this;
    }

    setVariationSettings(settings) {
        this.options.variationSettings = { ...this.options.variationSettings, ...settings };
        return this;
    }

    // Metodi di validazione
    validateDistribution(distribution) {
        const total = Object.values(distribution).reduce((a, b) => a + b, 0);
        return Math.abs(total - 1) < 0.001; // Deve sommare a 1
    }

    // Override dei metodi esistenti per usare le nuove impostazioni
    determineNoteType(step) {
        const rand = Math.random();
        const { single, chord, arpeggio } = this.options.noteDistribution;
        
        if (rand < single) return 'single';
        if (rand < single + chord) return 'chord';
        return 'arpeggio';
    }

    // Preset per diversi stili musicali
    static get presets() {
        return {
            minimal: {
                density: 0.3,
                complexity: 0.2,
                chordChance: 0.1,
                syncopationLevel: 0.1,
                repetitionChance: 0.8,
                arpeggioChance: 0.1,
                harmonicComplexity: 0.2,
                noteDistribution: { single: 0.8, chord: 0.2, arpeggio: 0 },
                rhythmicSettings: {
                    allowTriplets: false,
                    allowDotted: false,
                    minNoteLength: 8,
                    maxNoteLength: 32
                },
                melodicSettings: {
                    direction: 'mixed',
                    stepSize: 0.3,
                    octaveRange: 1
                },
                // ... altri settings specifici
            },
            dense: {
                density: 0.8,
                complexity: 0.7,
                chordChance: 0.4,
                syncopationLevel: 0.5,
                repetitionChance: 0.3,
                arpeggioChance: 0.3,
                harmonicComplexity: 0.6
            },
            jazzy: {
                density: 0.6,
                complexity: 0.8,
                chordChance: 0.6,
                syncopationLevel: 0.7,
                repetitionChance: 0.4,
                swingFactor: 0.7,
                harmonicComplexity: 0.8
            },
            dancey: {
                density: 0.5,
                complexity: 0.4,
                chordChance: 0.2,
                syncopationLevel: 0.6,
                repetitionChance: 0.7,
                arpeggioChance: 0.4,
                harmonicComplexity: 0.4
            },
            ambient: {
                density: 0.3,
                complexity: 0.3,
                chordChance: 0.8,
                syncopationLevel: 0.2,
                repetitionChance: 0.6,
                noteLengthVariety: 0.8,
                harmonicComplexity: 0.7
            },
            experimental: {
                density: 0.7,
                complexity: 0.9,
                chordChance: 0.5,
                syncopationLevel: 0.8,
                repetitionChance: 0.2,
                arpeggioChance: 0.6,
                harmonicComplexity: 0.9,
                scaleMode: 'chromatic'
            }
        };
    }

    // Aggiungiamo un metodo di utilità per garantire le impostazioni di default
    ensureDefaultSettings() {
        this.options.melodicSettings = {
            direction: 'mixed',
            stepSize: 0.5,
            octaveRange: 2,
            preferredIntervals: [0, 2, 3, 4, 5, 7],
            scaleMode: 'normal',
            ...this.options.melodicSettings
        };

        this.options.rhythmicSettings = {
            allowTriplets: true,
            allowDotted: true,
            minNoteLength: 4,
            maxNoteLength: 64,
            beatEmphasis: 0.8,
            offbeatEmphasis: 0.3,
            ...this.options.rhythmicSettings
        };

        this.options.noteDistribution = {
            single: 0.6,
            chord: 0.3,
            arpeggio: 0.1,
            ...this.options.noteDistribution
        };
    }
}
