import AbstractAudioComponentUI from '../abstract/AbstractAudioComponentUI.js';
import Knob from '../../ui-components/Knob.js';

export default class SequencerUI extends AbstractAudioComponentUI {
    constructor(sequencer, options = {}) {
        super(sequencer, {
            className: 'sequencer-component',
            allowSequencer: false, // Disabilitiamo la possibilità di aggiungere sequencer a un sequencer
            ...options
        });
        this.selectedStep = null;
    }

    buildUI() {
        // Add controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'sequencer-controls';

        // Create size controls
        const rowsInput = document.createElement('input');
        rowsInput.type = 'number';
        rowsInput.min = 1;
        rowsInput.max = 8;
        rowsInput.value = this.component.options.rows;
        rowsInput.className = 'size-input';
        rowsInput.id = 'rows-input';

        const colsInput = document.createElement('input');
        colsInput.type = 'number';
        colsInput.min = 1;
        colsInput.max = 32;
        colsInput.value = this.component.options.columns;
        colsInput.className = 'size-input';
        colsInput.id = 'cols-input';

        // Add labels
        const rowsLabel = document.createElement('label');
        rowsLabel.htmlFor = 'rows-input';
        rowsLabel.textContent = 'ROWS';
        
        const colsLabel = document.createElement('label');
        colsLabel.htmlFor = 'cols-input';
        colsLabel.textContent = 'COLS';

        // Create wrapper divs for input groups
        const rowsGroup = document.createElement('div');
        rowsGroup.className = 'input-group';
        rowsGroup.appendChild(rowsLabel);
        rowsGroup.appendChild(rowsInput);

        const colsGroup = document.createElement('div');
        colsGroup.className = 'input-group';
        colsGroup.appendChild(colsLabel);
        colsGroup.appendChild(colsInput);

        controlsContainer.appendChild(rowsGroup);
        controlsContainer.appendChild(colsGroup);

        this.container.appendChild(controlsContainer);

        // Create grid container
        const gridContainer = document.createElement('div');
        gridContainer.className = 'sequencer-grid';
        this.container.appendChild(gridContainer);

        this.updateGrid();
    }

    updateGrid() {
        const gridContainer = this.container.querySelector('.sequencer-grid');
        gridContainer.innerHTML = ''; // Clear existing grid
        
        gridContainer.style.gridTemplateColumns = `repeat(${this.component.options.columns}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${this.component.options.rows}, 1fr)`;

        // Create new buttons
        this.component.grid.forEach((active, i) => {
            const stepBtn = document.createElement('button');
            stepBtn.className = 'step-button';
            stepBtn.dataset.step = i;
            if (active) {
                stepBtn.classList.add('active');
            }            
            gridContainer.appendChild(stepBtn);
        });
    }

    setupEventListeners() {
        // Handle step button clicks
        this.container.addEventListener('click', (e) => {
            if (e.target.matches('.step-button')) {
                const step = parseInt(e.target.dataset.step);                
                // Toggle step
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

        // Add size input listeners
        this.container.querySelector('#rows-input').addEventListener('change', (e) => {
            const rows = Math.max(1, Math.min(8, parseInt(e.target.value) || 1));
            e.target.value = rows; // Ensure valid value is displayed
            this.component.updateSize(rows, this.component.options.columns);
            this.updateGrid();
        });

        this.container.querySelector('#cols-input').addEventListener('change', (e) => {
            const cols = Math.max(1, Math.min(32, parseInt(e.target.value) || 1));
            e.target.value = cols; // Ensure valid value is displayed
            this.component.updateSize(this.component.options.rows, cols);
            this.updateGrid();
        });
    }
}
