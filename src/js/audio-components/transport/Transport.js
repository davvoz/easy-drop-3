import AbstractAudioComponent from '../abstract/AbstractAudioComponent.js';

export default class Transport extends AbstractAudioComponent {
    constructor(id) {
        super(id);
        this.bpm = 120;
        this.isPlaying = false;
        this.sequences = new Map();
        this._currentTick = 0;
        this._lastTime = 0;
        this._ppqn = 24; // Pulses Per Quarter Note (standard MIDI)
        this.updateTickInterval();
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

    updateTickInterval() {
        // Calcola millisecondi per tick
        const minuteInMs = 60000;
        const quarterNoteInMs = minuteInMs / this.bpm;
        this._tickInterval = quarterNoteInMs / this._ppqn;
    }

    setBPM(value) {
        this.bpm = Math.max(30, Math.min(300, value));
        this.updateTickInterval();
        this.emit('bpm-change', this.bpm);
    }

    start() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this._lastTime = performance.now();
        this._currentTick = 0;
        this._tick();
        this.emit('play');
    }

    stop() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        this._currentTick = 0;
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

        const now = performance.now();
        const elapsed = now - this._lastTime;
        
        const ticksDue = Math.floor(elapsed / this._tickInterval);
        
        if (ticksDue > 0) {
            this._lastTime = now - (elapsed % this._tickInterval);
            
            for (let i = 0; i < ticksDue; i++) {
                this._currentTick++;
                
                // Emit tick event
                this.emit('tick', this._currentTick);
                
                this.sequences.forEach(sequence => {
                    sequence.processTick(this._currentTick);
                });

                // Log debug ogni quarto
                if (this._currentTick % this._ppqn === 0) {
                    console.debug('Quarter note:', this._currentTick / this._ppqn);
                }
            }
        }

        requestAnimationFrame(() => this._tick());
    }
}
