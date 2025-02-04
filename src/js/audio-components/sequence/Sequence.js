import EventEmitter from '../../utils/EventEmitter.js';
import SequenceTrack from './SequenceTrack.js';
import SequenceConfig from './SequenceConfig.js';

export default class Sequence extends EventEmitter {
    constructor(id, options = {}) {
        super();
        this.id = id;
        this.tracks = new Map();
        this.config = new SequenceConfig();
        
        if (options.preset) {
            this.config.loadPreset(options.preset);
        }
        
        if (options.config) {
            Object.entries(options.config).forEach(([key, value]) => {
                this.config.set(key, value);
            });
        }

        this.initialize();
    }

    initialize() {
        this.length = this.config.get('length');
        this.resolution = this.config.get('resolution');
        
        this.config.on('configChanged', this.handleConfigChange.bind(this));
        this.config.on('presetLoaded', this.handlePresetLoaded.bind(this));
    }

    handleConfigChange({ key, value }) {
        switch(key) {
            case 'length':
                this.updateLength(value);
                break;
            case 'resolution':
                this.updateResolution(value);
                break;
            // ... altri casi
        }
        this.emit('configChanged', { key, value });
    }

    handlePresetLoaded(presetName) {
        this.initialize();
        this.emit('presetLoaded', presetName);
    }

    addTrack(trackId, initialData = []) {
        const track = new SequenceTrack(trackId, this.length);
        if (initialData.length) {
            track.setSteps(initialData);
        }
        this.tracks.set(trackId, track);
        return track;
    }

    removeTrack(trackId) {
        this.tracks.delete(trackId);
    }

    updateLength() {
        const bars = this.config.get('bars');
        const beatsPerBar = this.config.get('beatsPerBar');
        const stepsPerBeat = this.config.get('stepsPerBeat');
        
        const newLength = bars * beatsPerBar * stepsPerBeat;
        
        if (newLength !== this.length) {
            this.length = newLength;
            this.tracks.forEach(track => track.resize(this.length));
            this.emit('lengthChanged', this.length);
        }
    }

    calculateStepIndex(bar, beat, step) {
        const beatsPerBar = this.config.get('beatsPerBar');
        const stepsPerBeat = this.config.get('stepsPerBeat');
        return (bar * beatsPerBar * stepsPerBeat) + 
               (beat * stepsPerBeat) + 
               step;
    }

    getStepDuration(tick) {
        const stepDuration = this.config.get('stepDuration');
        const swingAmount = this.config.get('swingAmount');
        
        // Applica lo swing agli step pari
        if (swingAmount > 0 && tick % 2 === 1) {
            return stepDuration * (1 + swingAmount);
        }
        return stepDuration;
    }

    processTick(beat, tick) {
        const velocitySensitivity = this.config.get('velocitySensitivity');
        const stepsPerBeat = this.config.get('stepsPerBeat');
        
        // Calcola la posizione corrente nella sequenza
        const currentBar = Math.floor(beat / this.config.get('beatsPerBar'));
        const currentBeat = beat % this.config.get('beatsPerBar');
        const currentStep = Math.floor((tick / 24) * stepsPerBeat); // 24 PPQN standard MIDI
        
        const stepIndex = this.calculateStepIndex(currentBar, currentBeat, currentStep);
        
        if (stepIndex < this.length) {
            this.tracks.forEach(track => {
                const stepData = track.getStepData(stepIndex);
                if (stepData.value) {
                    const velocity = Math.round(stepData.velocity * velocitySensitivity);
                    this.emit('trigger', {
                        trackId: track.id,
                        bar: currentBar,
                        beat: currentBeat,
                        step: currentStep,
                        stepIndex,
                        data: { ...stepData, velocity }
                    });
                }
            });
        }

        // Emetti sempre l'evento di tick per l'aggiornamento visuale
        this.emit('tick', { bar: currentBar, beat: currentBeat, step: currentStep, stepIndex });
    }

    setConfig(key, value) {
        this.config.set(key, value);
    }

    getConfig(key) {
        return this.config.get(key);
    }
}
