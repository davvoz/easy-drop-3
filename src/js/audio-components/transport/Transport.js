import AbstractAudioComponent from '../abstract/AbstractAudioComponent.js';

export default class Transport extends AbstractAudioComponent {
    constructor(id) {
        super(id);
        this.bpm = 120;
        this.isPlaying = false;
        this.currentBeat = 0;
        this.timeoutId = null;
        this.sequences = new Map();
        this.ticksPerBeat = 4; // subdivisions per beat
        this.currentTick = 0;
    }

    async setup() {
        // No audio nodes needed for transport
    }

    connect() {
        // Transport doesn't need audio connections
    }

    disconnect() {
        this.stop();
    }

    setBPM(value) {
        this.bpm = Math.max(30, Math.min(300, value));
        this.emit('bpm-change', this.bpm);
        
        if (this.isPlaying) {
            this.stop();
            this.start();
        }
    }

    start() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this._tick();
        this.emit('play');
    }

    stop() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        this.currentBeat = 0;
        this.emit('stop');
    }

    addSequence(sequence) {
        this.sequences.set(sequence.id, sequence);
    }

    removeSequence(sequenceId) {
        this.sequences.delete(sequenceId);
    }

    _tick() {
        if (!this.isPlaying) return;

        const beat = Math.floor(this.currentTick / this.ticksPerBeat);
        this.sequences.forEach(sequence => {
            sequence.processTick(beat, this.currentTick);
        });

        this.emit('tick', {
            beat,
            tick: this.currentTick
        });

        this.currentTick = (this.currentTick + 1) % (4 * this.ticksPerBeat);
        const interval = (60 / this.bpm / this.ticksPerBeat) * 1000;
        this.timeoutId = setTimeout(() => this._tick(), interval);
    }
}
