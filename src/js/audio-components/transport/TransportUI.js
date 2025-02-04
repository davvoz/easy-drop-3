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

        // Add tick indicator
        const tickIndicator = document.createElement('div');
        tickIndicator.className = 'tick-indicator';
        controlsContainer.appendChild(tickIndicator);

        // Add beat indicators container
        const beatsContainer = document.createElement('div');
        beatsContainer.className = 'beats-container';
        
        // Create 4 beat indicators
        for (let i = 0; i < 4; i++) {
            const beatDot = document.createElement('div');
            beatDot.className = 'beat-dot';
            beatsContainer.appendChild(beatDot);
        }
        
        controlsContainer.appendChild(beatsContainer);

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
        this.container.appendChild(controlsContainer);
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

        // Listen for tick events
        this.component.on('tick', (tick) => {
            if (tick % this.component._ppqn === 0) {  // Only on quarter notes
                const indicator = this.container.querySelector('.tick-indicator');
                indicator.classList.remove('pulse');
                void indicator.offsetWidth; // Trigger reflow
                indicator.classList.add('pulse');

                const beatIndex = Math.floor(tick / this.component._ppqn) % 4;
                const beatDots = this.container.querySelectorAll('.beat-dot');
                
                // Reset all dots
                beatDots.forEach(dot => dot.classList.remove('active'));
                // Activate current beat dot
                beatDots[beatIndex].classList.add('active');
            }
        });
    }
}
