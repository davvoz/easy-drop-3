import AbstractAudioComponentUI from '../abstract/AbstractAudioComponentUI.js';
import Button from '../../ui-components/Button.js';

export default class SequenceUI extends AbstractAudioComponentUI {
    constructor(sequence, options = {}) {
        super(sequence, {
            className: 'sequence-component',
            ...options
        });
        this.gridButtons = [];
        this.config = {
            showVelocity: options.showVelocity || false,
            showProbability: options.showProbability || false,
            colorScheme: options.colorScheme || 'default',
            ...options.config
        };
        this.currentStep = -1;
    }

    buildUI() {
        const container = document.createElement('div');
        container.className = 'sequence-container';

        // Pattern settings section
        const patternSettings = this.createPatternSettings();
        container.appendChild(patternSettings);

        // Grid section with beat markers
        const gridSection = document.createElement('div');
        gridSection.className = 'sequence-grid-section';
        
        const beatMarkers = this.createBeatMarkers();
        gridSection.appendChild(beatMarkers);

        const grid = this.createGrid();
        gridSection.appendChild(grid);
        
        container.appendChild(gridSection);

        // Timing controls
        const timingControls = this.createTimingControls();
        container.appendChild(timingControls);

        this.container.appendChild(container);
        this.updateGrid();

        // Aggiungi listener per il tick
        this.component.on('tick', this.updatePlayhead.bind(this));
    }

    createPatternSettings() {
        const settings = document.createElement('div');
        settings.className = 'pattern-settings';

        // Pattern length control (in bars)
        const lengthControl = document.createElement('div');
        lengthControl.className = 'length-control';
        
        const barsInput = document.createElement('input');
        barsInput.type = 'number';
        barsInput.min = '1';
        barsInput.max = '32';
        barsInput.value = this.component.config.get('bars');
        barsInput.onchange = () => {
            this.component.setConfig('bars', parseInt(barsInput.value));
            this.rebuildGrid();
        };

        const beatsPerBarInput = document.createElement('input');
        beatsPerBarInput.type = 'number';
        beatsPerBarInput.min = '1';
        beatsPerBarInput.max = '16';
        beatsPerBarInput.value = this.component.config.get('beatsPerBar');
        beatsPerBarInput.onchange = () => {
            this.component.setConfig('beatsPerBar', parseInt(beatsPerBarInput.value));
            this.rebuildGrid();
        };

        settings.append(
            this.createLabel('Bars'), barsInput,
            this.createLabel('Beats/Bar'), beatsPerBarInput
        );

        return settings;
    }

    createBeatMarkers() {
        const markers = document.createElement('div');
        markers.className = 'beat-markers';
        
        const bars = this.component.config.get('bars');
        const beatsPerBar = this.component.config.get('beatsPerBar');
        
        for (let bar = 0; bar < bars; bar++) {
            for (let beat = 0; beat < beatsPerBar; beat++) {
                const marker = document.createElement('div');
                marker.className = 'beat-marker';
                marker.textContent = `${bar + 1}.${beat + 1}`;
                markers.appendChild(marker);
            }
        }
        
        return markers;
    }

    createTimingControls() {
        const controls = document.createElement('div');
        controls.className = 'timing-controls';

        // Step Resolution
        const resolutionSelect = document.createElement('select');
        [1, 2, 3, 4, 6, 8, 12, 16].forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = `1/${value}`;
            resolutionSelect.appendChild(option);
        });
        resolutionSelect.value = this.component.config.get('stepsPerBeat');
        resolutionSelect.onchange = () => {
            this.component.setConfig('stepsPerBeat', parseInt(resolutionSelect.value));
            this.rebuildGrid();
        };

        // Swing Amount
        const swingControl = document.createElement('input');
        swingControl.type = 'range';
        swingControl.min = '0';
        swingControl.max = '0.75';
        swingControl.step = '0.05';
        swingControl.value = this.component.config.get('swingAmount');
        swingControl.onchange = () => {
            this.component.setConfig('swingAmount', parseFloat(swingControl.value));
        };

        controls.append(
            this.createLabel('Resolution'), resolutionSelect,
            this.createLabel('Swing'), swingControl
        );

        return controls;
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'sequence-toolbar';

        // Preset selector
        const presetSelect = document.createElement('select');
        presetSelect.className = 'preset-selector';
        this.component.config._presets.forEach((_, name) => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            presetSelect.appendChild(option);
        });

        // View mode toggle
        const viewModeToggle = document.createElement('button');
        viewModeToggle.className = 'view-mode-toggle';
        
        toolbar.append(presetSelect, viewModeToggle);
        return toolbar;
    }

    createGrid() {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'sequence-grid';

        // Create step buttons
        for (let i = 0; i < this.component.length; i++) {
            const stepButton = new Button(`step-${i}`, {
                className: 'sequence-step',
                label: ''
            });
            this.gridButtons[i] = stepButton;
            stepButton.render(gridContainer);
        }

        return gridContainer;
    }

    createControls() {
        const configContainer = document.createElement('div');
        configContainer.className = 'sequence-config';
        
        // Swing control
        const swingControl = document.createElement('input');
        swingControl.type = 'range';
        swingControl.min = 0;
        swingControl.max = 1;
        swingControl.step = 0.01;
        swingControl.value = this.component.getConfig('swing');
        configContainer.appendChild(swingControl);

        // Bars control
        const barsControl = document.createElement('input');
        barsControl.type = 'number';
        barsControl.min = 1;
        barsControl.max = 8;
        barsControl.value = this.component.config.get('bars');
        barsControl.onchange = () => this.component.setConfig('bars', parseInt(barsControl.value));
        
        // Steps per beat
        const stepsControl = document.createElement('select');
        [2,3,4,6,8,16].forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = `${value} steps`;
            stepsControl.appendChild(option);
        });
        stepsControl.value = this.component.config.get('stepsPerBeat');
        stepsControl.onchange = () => this.component.setConfig('stepsPerBeat', parseInt(stepsControl.value));

        // Velocity sensitivity
        const sensitivityControl = document.createElement('input');
        sensitivityControl.type = 'range';
        sensitivityControl.min = 0;
        sensitivityControl.max = 2;
        sensitivityControl.step = 0.1;
        sensitivityControl.value = this.component.config.get('velocitySensitivity');
        
        configContainer.append(
            this.createLabel('Bars'), barsControl,
            this.createLabel('Steps'), stepsControl,
            this.createLabel('Sensitivity'), sensitivityControl
        );

        return configContainer;
    }

    createLabel(text) {
        const label = document.createElement('label');
        label.textContent = text;
        return label;
    }

    handleConfigChange({ key, value }) {
        switch(key) {
            case 'length':
                this.rebuildGrid();
                break;
            case 'viewMode':
                this.updateViewMode(value);
                break;
            default:
                this.updateGrid();
        }
    }

    handlePresetLoaded() {
        this.rebuildGrid();
        this.updateGrid();
    }

    updateGrid() {
        const track = this.component.tracks.get('osc-1');
        if (!track) return;

        this.gridButtons.forEach((button, index) => {
            const stepData = track.getStepData(index);
            if (stepData.value) {
                button.element.classList.add('active');
                if (this.config.showVelocity) {
                    button.element.style.opacity = stepData.velocity / 100;
                }
            } else {
                button.element.classList.remove('active');
            }
        });
    }

    setupEventListeners() {
        this.gridButtons.forEach((button, index) => {
            button.on('trigger', () => {
                const track = this.component.tracks.get('osc-1');
                if (track) {
                    const currentValue = track.getStep(index);
                    track.setStep(index, currentValue ? 0 : 1);
                    this.updateGrid();
                }
            });
        });
    }

    rebuildGrid() {
        // Calculate total steps based on current configuration
        const bars = this.component.config.get('bars');
        const beatsPerBar = this.component.config.get('beatsPerBar');
        const stepsPerBeat = this.component.config.get('stepsPerBeat');
        const totalSteps = bars * beatsPerBar * stepsPerBeat;

        // Clear existing grid
        const gridContainer = this.container.querySelector('.sequence-grid');
        gridContainer.innerHTML = '';
        this.gridButtons = [];

        // Create new step buttons
        for (let i = 0; i < totalSteps; i++) {
            const stepButton = new Button(`step-${i}`, {
                className: 'sequence-step',
                label: ''
            });
            this.gridButtons[i] = stepButton;
            stepButton.render(gridContainer);
        }

        // Update grid columns in CSS
        gridContainer.style.gridTemplateColumns = `repeat(${stepsPerBeat}, 1fr)`;
        gridContainer.style.gridAutoRows = `${beatsPerBar}fr`;

        // Rebuild beat markers
        const markersContainer = this.container.querySelector('.beat-markers');
        if (markersContainer) {
            markersContainer.innerHTML = '';
            for (let bar = 0; bar < bars; bar++) {
                for (let beat = 0; beat < beatsPerBar; beat++) {
                    const marker = document.createElement('div');
                    marker.className = 'beat-marker';
                    marker.textContent = `${bar + 1}.${beat + 1}`;
                    markersContainer.appendChild(marker);
                }
            }
        }

        // Re-setup event listeners
        this.setupEventListeners();
        this.currentStep = -1;
        this.updateGrid();
    }

    updatePlayhead({ stepIndex }) {
        // Rimuovi l'evidenziazione dal vecchio step
        if (this.currentStep >= 0 && this.gridButtons[this.currentStep]) {
            this.gridButtons[this.currentStep].element.classList.remove('playing');
        }
        
        // Evidenzia il nuovo step
        if (this.gridButtons[stepIndex]) {
            this.gridButtons[stepIndex].element.classList.add('playing');
        }
        
        this.currentStep = stepIndex;
    }
}
