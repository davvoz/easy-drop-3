import AbstractAudioComponentUI from '../abstract/AbstractAudioComponentUI.js';
import Button from '../../ui-components/Button.js';
import Knob from '../../ui-components/Knob.js';

export default class TransportUI extends AbstractAudioComponentUI {
    constructor(transport, options = {}) {
        super(transport, {
            className: 'transport-component',
            ...options
        });
    }

    buildUI() {
        // Create transport controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'transport-controls';

        // BPM Knob
        const bpmContainer = document.createElement('div');
        bpmContainer.className = 'knob-container bpm-knob';
        
        const bpmKnob = new Knob(bpmContainer, {
            id: 'bpm',
            min: 30,
            max: 300,
            value: 120,
            size: 60
        });
        this.addControl('bpm', bpmKnob);

        // Play/Stop Button
        const playButton = new Button('transport-play', {
            label: '▶',
            className: 'midi-button play-button'
        });
        this.addControl('play', playButton);

        // Append controls
        this.container.appendChild(bpmContainer);
        playButton.render(this.container);
    }

    setupEventListeners() {
        const bpmKnob = this.getControl('bpm');
        bpmKnob.on('change', ({ value }) => {
            this.component.setBPM(value);
        });

        const playButton = this.getControl('play');
        let isPlaying = false;

        playButton.on('trigger', () => {
            if (!isPlaying) {
                this.component.start();
                playButton.element.textContent = '⏹';
                playButton.element.classList.add('playing');
            } else {
                this.component.stop();
                playButton.element.textContent = '▶';
                playButton.element.classList.remove('playing');
            }
            isPlaying = !isPlaying;
        });

        // Listen for transport events
        this.component.on('stop', () => {
            playButton.element.textContent = '▶';
            playButton.element.classList.remove('playing');
            isPlaying = false;
        });
    }
}
