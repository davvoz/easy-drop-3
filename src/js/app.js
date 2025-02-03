import ToggleButton from './ui-components/ToggleButton.js';
import Button from './ui-components/Button.js';
import Radio from './ui-components/Radio.js';
import Slider from './ui-components/Slider.js';
import Knob from './ui-components/Knob.js';  // Add this import
import MIDILearnManager from './midi/MIDILearnManager.js';
import MIDILogger from './utils/MIDILogger.js';

async function initializeApp() {
    try {
        // Inizializza il logger MIDI
        MIDILogger.initialize();
        
        // Attendiamo che il DOM sia completamente caricato
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }

        // Inizializza il sistema MIDI
        const midiInitialized = await MIDILearnManager.initialize();
        if (!midiInitialized) {
            console.warn('MIDI initialization failed');
            document.getElementById('controls').innerHTML = `
                <div class="warning">
                    MIDI support not available. Please ensure you're using Chrome with a MIDI device connected.
                </div>`;
            return;
        }

        // Crea il container centrale
        const controlsContainer = document.getElementById('controls');
        controlsContainer.className = 'center-container';

        // Crea il container per i controlli
        const togglesContainer = document.createElement('div');
        togglesContainer.className = 'toggles-container';
        controlsContainer.appendChild(togglesContainer);

        // Crea i due toggle button
        const midiToggle1 = new ToggleButton('midiToggle1', {
            label: 'Toggle 1',
            className: 'midi-toggle-button main-toggle'
        });

        const midiToggle2 = new ToggleButton('midiToggle2', {
            label: 'Toggle 2',
            className: 'midi-toggle-button main-toggle'
        });

        // Crea il button
        const actionButton = new Button('actionButton', {
            label: 'Action',
            className: 'midi-button main-button'
        });

        // Eventi dei toggle
        midiToggle1.on('activate', () => {
            console.log('Toggle 1 ON');
            MIDILogger.log('midiToggle1', 'Activated', { state: 'ON' });
        });
        
        midiToggle1.on('deactivate', () => {
            console.log('Toggle 1 OFF');
            MIDILogger.log('midiToggle1', 'Deactivated', { state: 'OFF' });
        });

        midiToggle2.on('activate', () => {
            console.log('Toggle 2 ON');
            MIDILogger.log('midiToggle2', 'Activated', { state: 'ON' });
        });
        
        midiToggle2.on('deactivate', () => {
            console.log('Toggle 2 OFF');
            MIDILogger.log('midiToggle2', 'Deactivated', { state: 'OFF' });
        });

        // Eventi del button - ora usiamo solo l'evento trigger
        actionButton.on('trigger', () => {
            console.log('Action button triggered');
            MIDILogger.log('actionButton', 'Triggered');
        });

        // Renderizza i controlli
        midiToggle1.render(togglesContainer);
        midiToggle2.render(togglesContainer);
        actionButton.render(togglesContainer);

        // Aggiunge il container per i radio buttons
        const radioContainer = document.createElement('div');
        radioContainer.className = 'toggles-container';
        controlsContainer.appendChild(radioContainer);

        // Crea il gruppo di radio buttons
        const radio1 = new Radio('radio1', {
            label: 'Option 1',
            group: 'demoGroup',
            className: 'midi-toggle-button main-toggle'
        });

        const radio2 = new Radio('radio2', {
            label: 'Option 2',
            group: 'demoGroup',
            className: 'midi-toggle-button main-toggle'
        });

        const radio3 = new Radio('radio3', {
            label: 'Option 3',
            group: 'demoGroup',
            className: 'midi-toggle-button main-toggle'
        });

        // Eventi dei radio buttons
        [radio1, radio2, radio3].forEach(radio => {
            radio.on('activate', () => {
                console.log(`${radio.options.label} selected`);
                MIDILogger.log('radio', 'Selected', { option: radio.options.label });
            });
        });

        // Renderizza i radio buttons
        radio1.render(radioContainer);
        radio2.render(radioContainer);
        radio3.render(radioContainer);

        // After rendering radio buttons, add the slider
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        controlsContainer.appendChild(sliderContainer);

        // Create slider instance
        const slider = new Slider('demoSlider', {
            min: 0,
            max: 127,
            value: 64,
            className: 'midi-slider'
        });

        // Add vertical slider
        const verticalSlider = new Slider('verticalSlider', {
            min: 0,
            max: 127,
            value: 64,
            vertical: true,
            className: 'midi-slider vertical'
        });

        // Add slider events
        slider.on('change', (value) => {
            console.log(`Slider value: ${value}`);
            MIDILogger.log('slider', 'Value changed', { value });
        });

        verticalSlider.on('change', (value) => {
            console.log(`Vertical slider value: ${value}`);
            MIDILogger.log('verticalSlider', 'Value changed', { value });
        });

        // Render the sliders
        slider.render(sliderContainer);
        verticalSlider.render(sliderContainer);

        // Add knob container
        const knobContainer = document.createElement('div');
        knobContainer.className = 'knob-container';
        controlsContainer.appendChild(knobContainer);

        // Create knob instance
        const knob = new Knob(document.createElement('div'), {
            id: 'demoKnob',
            min: 0,
            max: 100,
            value: 50,
            size: 60
        });

        // Add knob events
        knob.on('change', ({ value }) => {
            console.log(`Knob value: ${value}`);
            MIDILogger.log('knob', 'Value changed', { value });
        });

        // Render the knob
        knobContainer.appendChild(knob.render());

        // Aggiunge le istruzioni
        const instructions = document.createElement('div');
        instructions.className = 'instructions';
        instructions.textContent = 'Right-click to enter MIDI learn mode';
        controlsContainer.appendChild(instructions);

    } catch (error) {
        console.error('Failed to initialize:', error);
        document.getElementById('controls').innerHTML = `
            <div class="error">Initialization failed: ${error.message}</div>`;
    }
}

// Avvia l'app quando il DOM è pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
