import BaseConfig from '../../config/BaseConfig.js';

export default class SequenceConfig extends BaseConfig {
    constructor() {
        super({
            length: 16,
            resolution: 16,
            swing: 0,
            tempo: 120,
            gridSize: { rows: 1, cols: 16 },
            defaultVelocity: 100,
            defaultProbability: 1,
            defaultDuration: 0.25,
            colorScheme: 'default',
            stepVisualization: 'blocks', // 'blocks', 'circles', 'bars'
            viewMode: 'basic', // 'basic', 'advanced'
            autoScroll: true,
            quantize: true,
            midiSync: false,
            bars: 1,                    // Numero di battute
            beatsPerBar: 4,            // Battiti per battuta
            stepsPerBeat: 4,           // Step per battito
            stepDuration: 1/16,        // Durata relativa di ogni step
            velocitySensitivity: 1,    // Sensibilità della velocity (0-2)
            swingAmount: 0,            // Quantità di swing (0-1)
            timeSignature: {
                numerator: 4,          // Numeratore della time signature
                denominator: 4         // Denominatore della time signature
            }
        });

        this.initializePresets();
    }

    initializePresets() {
        this.savePreset('default', this._config);
        this.savePreset('drum-machine', {
            length: 16,
            gridSize: { rows: 4, cols: 16 },
            stepVisualization: 'blocks'
        });
        this.savePreset('melodic', {
            length: 32,
            gridSize: { rows: 1, cols: 32 },
            stepVisualization: 'bars'
        });
        this.savePreset('triplets', {
            stepsPerBeat: 3,
            stepDuration: 1/12
        });
        this.savePreset('slow', {
            beatsPerBar: 2,
            stepsPerBeat: 2,
            stepDuration: 1/8
        });
    }
}
