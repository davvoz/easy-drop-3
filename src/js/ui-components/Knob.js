import AbstractUIComponent from './AbstractUIComponent.js';
import MIDILearnManager from '../midi/MIDILearnManager.js';

export default class Knob extends AbstractUIComponent {
    constructor(element, options = {}) {
        super(options.id || 'knob');
        
        this.element = element;
        this.options = {
            min: options.min || 0,
            max: options.max || 127, // Cambiato da 1 a 127
            value: options.value || 63.5, // Cambiato per essere a metà del range MIDI
            step: options.step || 1, // Cambiato da 0.01 a 1 per valori MIDI interi
            size: options.size || 40,
            onChange: options.onChange || (() => {})
        };

        this.value = this.options.value;
        this.isDragging = false;
        this.lastY = 0;
        this.isLearning = false;

        // Initialize handlers as class properties
        this.moveHandler = null;
        this.startHandler = null;
        this.endHandler = null;
        
        this.setup();
    }

    render() {
        this.element.style.width = `${this.options.size}px`;
        this.element.style.height = `${this.options.size}px`;
        
        this.element.innerHTML = `
            <div class="knob-body">
                <div class="knob-indicator"></div>
            </div>
            <div class="knob-value">${this.formatValue(this.value)}</div>
        `;

        this.addEventListeners();
        this.updateRotation();
        return this.element;
    }

    setup() {
        this.render();
        this.setupMIDILearnSupport();
    }

    setupMIDILearnSupport() {
        MIDILearnManager.on('learnStart', (component) => {
            if (component === this) {
                this.isLearning = true;
                this.onLearnStart();
            }
        });

        MIDILearnManager.on('learnStop', (component) => {
            if (component === this) {
                this.isLearning = false;
                this.onLearnStop();
            }
        });

        MIDILearnManager.on('learned', ({component, mapping}) => {
            if (component === this) {
                this.onMIDILearned(mapping);
            }
        });

        // Add right-click handler for MIDI learn
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.startMIDILearn();
        });
    }

    startMIDILearn() {
        console.log('Starting MIDI learn for knob');
        MIDILearnManager.startLearning(this);
    }

    onLearnStart() {
        console.log('Knob learning started');
        this.element.querySelector('.knob-body').classList.add('learning');
    }

    onLearnStop() {
        console.log('Knob learning stopped');
        this.element.querySelector('.knob-body').classList.remove('learning');
    }

    onMIDILearned(mapping) {
        if (this.element) {
            this.element.setAttribute('data-midi-mapping', 
                `${mapping.channel}:${mapping.control}:${mapping.type}`);
        }
    }

    // Override onMIDIValueChange from AbstractUIComponent
    onMIDIValueChange(scaledValue, binding) {
        // Ora scaledValue è il valore MIDI diretto (0-127)
        console.log('Knob MIDI value received:', scaledValue);
        this.setValue(scaledValue);
    }

    setValue(newValue) {
        // Assicuriamoci che il valore sia intero
        const value = Math.round(Math.min(this.options.max, 
                     Math.max(this.options.min, newValue)));
        
        if (value !== this.value) {
            this.value = value;
            this.updateRotation();
            this.updateDisplay();
            this.options.onChange(this.value);
            this.emit('change', { value: this.value });
        }
    }

    addEventListeners() {
        this.moveHandler = (e) => {
            if (!this.isDragging) return;
            e.preventDefault();
            
            const y = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            const delta = (this.lastY - y) * 0.5;
            this.lastY = y;

            const range = this.options.max - this.options.min;
            const deltaValue = (delta / 100) * range; // Aumentata la sensibilità
            this.setValue(this.value + deltaValue);
        };

        this.startHandler = (e) => {
            // Prevent MIDI learn when left clicking
            if (e.button === 2) {
                e.preventDefault();
                this.startMIDILearn();
                return;
            }
            
            this.isDragging = true;
            this.lastY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            this.element.classList.add('active');
        };

        this.endHandler = () => {
            this.isDragging = false;
            this.element.classList.remove('active');
        };

        // Mouse & Touch events
        this.element.addEventListener('mousedown', this.startHandler);
        this.element.addEventListener('touchstart', this.startHandler, { passive: false });
        document.addEventListener('mousemove', this.moveHandler);
        document.addEventListener('touchmove', this.moveHandler, { passive: false });
        document.addEventListener('mouseup', this.endHandler);
        document.addEventListener('touchend', this.endHandler);

        // Context menu handler
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.startMIDILearn();
        });
    }

    updateRotation() {
        const percent = (this.value - this.options.min) / (this.options.max - this.options.min);
        const degrees = -150 + (percent * 300);
        this.element.querySelector('.knob-indicator').style.transform = `rotate(${degrees}deg)`;
    }

    updateDisplay() {
        this.element.querySelector('.knob-value').textContent = this.formatValue(this.value);
    }

    formatValue(value) {
        // Modifica per mostrare valori interi
        return Math.round(value);
    }

    destroy() {
        // Remove event listeners
        this.element.removeEventListener('mousedown', this.startHandler);
        this.element.removeEventListener('touchstart', this.startHandler);
        document.removeEventListener('mousemove', this.moveHandler);
        document.removeEventListener('touchmove', this.moveHandler);
        document.removeEventListener('mouseup', this.endHandler);
        document.removeEventListener('touchend', this.endHandler);
        
        // Call parent destroy
        super.destroy();
    }
}
