import AbstractAudioComponent from '../abstract/AbstractAudioComponent.js';

export default class Sequencer extends AbstractAudioComponent {
    constructor(id) {
        super(id);
        this.steps = 16;
        this.grid = new Array(this.steps).fill(false);
        this.currentStep = 0;
        this.instrument = null;
    }

    async setup() {
        // No audio nodes needed for sequencer
    }

    setInstrument(instrument) {
        this.instrument = instrument;
    }

    toggleStep(step) {
        if (step >= 0 && step < this.steps) {
            this.grid[step] = !this.grid[step];
            this.emit('grid-update', this.grid);
        }
    }

    processTick(tick) {
        // Converti i tick MIDI (24 ppqn) in step del sequencer
        if (tick % 6 === 0) {  // Ogni 6 tick = 1/16th note
            this.currentStep = (Math.floor(tick / 6) % this.steps);
            
            if (this.grid[this.currentStep] && this.instrument) {
                this.instrument.triggerNote(127, 100);
            }

            this.emit('step', this.currentStep);
        }
    }

    connect(destination) {
        // Il sequencer non ha nodi audio da collegare
        // ma dobbiamo implementare il metodo astratto
        return this;
    }

    disconnect() {
        // Il sequencer non ha nodi audio da scollegare
        // ma dobbiamo implementare il metodo astratto
        return this;
    }
}
