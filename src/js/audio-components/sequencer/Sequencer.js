import AbstractAudioComponent from '../abstract/AbstractAudioComponent.js';

export default class Sequencer extends AbstractAudioComponent {
    constructor(id, options = {}) {
        super(id);
        this.options = {
            steps: 16,
            rows: 4,
            columns: 4,
            ...options
        };
        
        this.steps = this.options.rows * this.options.columns;
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

    updateSize(rows, columns) {
        this.options.rows = rows;
        this.options.columns = columns;
        
        // Calculate new total steps
        const newSteps = rows * columns;
        const newGrid = new Array(newSteps).fill(false);
        
        // Preserve existing pattern where possible
        for (let i = 0; i < Math.min(this.steps, newSteps); i++) {
            newGrid[i] = this.grid[i];
        }
        
        this.steps = newSteps;
        this.grid = newGrid;
        this.currentStep = Math.min(this.currentStep, newSteps - 1);
        
        this.emit('grid-update', this.grid);
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
