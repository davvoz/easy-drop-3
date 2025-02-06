import AbstractAudioComponentUI from '../abstract/AbstractAudioComponentUI.js';
import Knob from '../../ui-components/Knob.js';
import Radio from '../../ui-components/Radio.js';
import Button from '../../ui-components/Button.js';
import PianoRoll from '../piano-roll/PianoRoll.js';  // Aggiungi questa importazione
import PianoRollUI from '../piano-roll/PianoRollUI.js';  // E questa per la UI

export default class SimpleOscUI extends AbstractAudioComponentUI {
    constructor(simpleOsc, options = {}) {
        super(simpleOsc, {
            className: 'simple-osc-component vertical-layout',
            sequencerType: 'pianoRoll', // Specifichiamo che vogliamo un piano roll
            ...options
        });
        
        this.currentSequencerUI = null;
    }

    buildUI() {
        // Create main controls container for oscillator
        const oscillatorControls = document.createElement('div');
        oscillatorControls.className = 'oscillator-controls';

        // Create DOM elements for knobs
        const freqKnobElement = document.createElement('div');
        freqKnobElement.className = 'knob-container frequency-knob';
        
        const volumeKnobElement = document.createElement('div');
        volumeKnobElement.className = 'knob-container volume-knob';

        // Frequency knob
        const freqKnob = new Knob(freqKnobElement, {
            id: 'frequency',
            min: 0,
            max: 127,
            value: 64, // Middle value
            size: 60
        });
        this.addControl('frequency', freqKnob);

        // Volume knob
        const volumeKnob = new Knob(volumeKnobElement, {
            id: 'volume',
            min: 0,
            max: 127,
            value: 100,
            size: 60
        });
        this.addControl('volume', volumeKnob);

        // Waveform selector
        const waveforms = [
            { type: 'sine', symbol: '∿' },     // Unicode 223F - SINE WAVE
            { type: 'square', symbol: '⊓' },   // Unicode 2293 - SQUARE WAVE
            { type: 'sawtooth', symbol: '⋀' },  // Unicode 22C0 - SAW WAVE (approssimato con triangolo)
            { type: 'triangle', symbol: '△' }   // Unicode 25B3 - TRIANGLE WAVE
        ];

        const waveformContainer = document.createElement('div');
        waveformContainer.className = 'waveform-container';

        // Fix the radio buttons rendering
        waveforms.forEach(({ type, symbol }) => {
            const radio = new Radio(`wave-${type}`, {
                label: symbol,
                className: 'wave-button',
                group: 'waveforms'
            });
            
            this.addControl(`wave-${type}`, radio);
            radio.render(waveformContainer); // This should now work correctly
        });

        // Set initial waveform after rendering
        this.getControl('wave-sine').activate();

        // Sposta tutti i controlli dell'oscillatore nel nuovo container
        oscillatorControls.appendChild(freqKnobElement);
        oscillatorControls.appendChild(volumeKnobElement);
        oscillatorControls.appendChild(waveformContainer);

        // Add main containers to component
        this.container.appendChild(oscillatorControls);

        // Create sequencer if needed
        this.currentSequencerUI = this.createSequencer();
        if (this.currentSequencerUI && this.currentSequencerUI.container) {
            this.container.appendChild(this.currentSequencerUI.container);
        }
    }

    setupEventListeners() {
        this.getControl('frequency').on('change', ({ value }) => {
            this.component.setFrequency(value);
        });

        this.getControl('volume').on('change', ({ value }) => {
            this.component.setVolume(value);
        });

        const waveforms = ['sine', 'square', 'sawtooth', 'triangle'];
        waveforms.forEach(type => {
            const control = this.getControl(`wave-${type}`);
            console.log(`Setting up listener for ${type}`, control); // Debug
            
            control.on('change', isActive => {
                console.log('Waveform change event:', {
                    type,
                    isActive,
                    control: control.id
                });
                
                if (isActive) {
                    this.component.setWaveform(type);
                }
            });
        });

        // Aggiungiamo il listener per il playButton
        // const playButton = this.getControl('play');
        // let isPlaying = false;

        // playButton.on('trigger', () => {
        //     if (!isPlaying) {
        //         this.component.setVolume(100);
        //         playButton.element.classList.add('playing');
        //         isPlaying = true;
        //     } else {
        //         this.component.setVolume(0);
        //         playButton.element.classList.remove('playing');
        //         isPlaying = false;
        //     }
        // });
    }

    createSequencer() {
        if (this.options.sequencerType !== 'pianoRoll') return null;

        const pianoRoll = new PianoRoll(`piano-osc-${this.component.id}`, {
            rows: 88,
            columns: 64,
            startNote: 21,
            endNote: 108,
            pixelsPerStep: 30,
            stepsPerBeat: 4,
            beatsPerBar: 4,
            composerOptions: {
                rootNote: 60,
                melodicRange: 48
            }
        });

        pianoRoll.setInstrument(this.component);
        const pianoRollUI = new PianoRollUI(pianoRoll);

        return pianoRollUI;
    }
}
