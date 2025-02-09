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

    addSequence(sequencer) {
        if (!this.sequences.has(sequencer.id)) {
            this.sequences.set(sequencer.id, sequencer);
            console.log('Sequence added to transport:', sequencer.id);
            
            // Se il transport è già in riproduzione, avvia anche la nuova sequenza
            if (this.isPlaying) {
                sequencer.processTick(this._currentTick);
            }
        }
    }

    removeSequence(sequenceId) {
        this.sequences.delete(sequenceId);
    }

    processTick() {
        if (!this.isPlaying) return;
        
        // Log per debug
        if (this.tick % 24 === 0) { // Log ogni battito
            console.log('Transport tick:', {
                tick: this.tick,
                sequences: this.sequences.length,
                playing: this.isPlaying
            });
        }

        // Processa tutte le sequenze
        this.sequences.forEach(sequence => {
            if (sequence && typeof sequence.processTick === 'function') {
                sequence.processTick(this.tick);
            }
        });

        this.tick = (this.tick + 1) % this.getTicksPerLoop();
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
                
                // Processa tutte le sequenze
                this.sequences.forEach((sequence, id) => {
                    if (sequence && typeof sequence.processTick === 'function') {
                        try {
                            sequence.processTick(this._currentTick);
                        } catch (error) {
                            console.error(`Error processing tick for sequence ${id}:`, error);
                        }
                    }
                });
            }
        }

        requestAnimationFrame(() => this._tick());
    }
}
