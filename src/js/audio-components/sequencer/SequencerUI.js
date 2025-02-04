import AbstractAudioComponentUI from '../abstract/AbstractAudioComponentUI.js';

export default class SequencerUI extends AbstractAudioComponentUI {
    constructor(sequencer, options = {}) {
        super(sequencer, {
            className: 'sequencer-component',
            ...options
        });
    }

    buildUI() {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'sequencer-grid';

        // Create 16 step buttons (4x4 grid)
        for (let i = 0; i < this.component.steps; i++) {
            const stepBtn = document.createElement('button');
            stepBtn.className = 'step-button';
            stepBtn.dataset.step = i;
            gridContainer.appendChild(stepBtn);
        }

        this.container.appendChild(gridContainer);
    }

    setupEventListeners() {
        // Handle step button clicks
        this.container.addEventListener('click', (e) => {
            if (e.target.matches('.step-button')) {
                const step = parseInt(e.target.dataset.step);
                this.component.toggleStep(step);
                e.target.classList.toggle('active');
            }
        });

        // Listen for step updates from sequencer
        this.component.on('step', (currentStep) => {
            const buttons = this.container.querySelectorAll('.step-button');
            buttons.forEach((btn, index) => {
                btn.classList.toggle('current', index === currentStep);
            });
        });
    }
}
