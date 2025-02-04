import AbstractAudioComponentUI from '../abstract/AbstractAudioComponentUI.js';
import Knob from '../../ui-components/Knob.js';
import Radio from '../../ui-components/Radio.js';
import Button from '../../ui-components/Button.js';

export default class SimpleOscUI extends AbstractAudioComponentUI {
    constructor(simpleOsc, options = {}) {
        super(simpleOsc, {
            className: 'simple-osc-component',
            ...options
        });
    }

    buildUI() {
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

        waveforms.forEach(({ type, symbol }) => {
            const btn = new Radio(`wave-${type}`, {
                label: symbol,
                className: 'wave-button',
                group: 'waveforms'
            });
            
            this.addControl(`wave-${type}`, btn);
            btn.render(waveformContainer);
        });

        // Set initial waveform
        this.getControl('wave-sine').activate();

        // Sostituiamo il playButton con la nostra classe Button
        const playButton = new Button('play-button', {
            label: 'PLAY',
            className: 'midi-button play-button'
        });
        this.addControl('play', playButton);

        // Append all controls
        this.container.appendChild(freqKnobElement);
        this.container.appendChild(volumeKnobElement);
        this.container.appendChild(waveformContainer);
        playButton.render(this.container);
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
        const playButton = this.getControl('play');
        let isPlaying = false;

        playButton.on('trigger', () => {
            if (!isPlaying) {
                this.component.setVolume(100);
                playButton.element.classList.add('playing');
                isPlaying = true;
            } else {
                this.component.setVolume(0);
                playButton.element.classList.remove('playing');
                isPlaying = false;
            }
        });
    }
}
