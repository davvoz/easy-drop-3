import AbstractUIComponent from './AbstractUIComponent.js';
import MIDILearnManager from '../midi/MIDILearnManager.js';

export default class Slider extends AbstractUIComponent {
    constructor(id, options = {}) {
        super(id);
        
        this.options = {
            min: options.min || 0,
            max: options.max || 127,
            value: options.value || 0,
            vertical: options.vertical || false,
            className: options.className || 'midi-slider',
            ...options
        };

        this._value = this.options.value;
        this.initialize();
    }

    initialize() {
        this.element = document.createElement('div');
        this.element.id = this.id;
        this.element.className = this.options.className;

        if (this.options.vertical) {
            this.element.style.width = '30px';
            this.element.style.height = '200px';
            // Rimuoviamo la rotazione e gestiamo il layout in modo nativo
        }

        // Create value display
        this.valueDisplay = document.createElement('div');
        this.valueDisplay.className = 'slider-value';
        
        // Create slider track
        this.track = document.createElement('div');
        this.track.className = 'slider-track';
        
        // Create slider thumb
        this.thumb = document.createElement('div');
        this.thumb.className = 'slider-thumb';
        
        this.track.appendChild(this.thumb);
        this.element.appendChild(this.valueDisplay);
        this.element.appendChild(this.track);

        this.setupEventListeners();
        this.setupMIDILearnSupport();
        this.updateDisplay();
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
    }

    setupEventListeners() {
        let isDragging = false;

        // Mouse events
        this.track.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Right click
                e.preventDefault();
                this.startMIDILearn();
                return;
            }
            isDragging = true;
            this.handleDrag(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                this.handleDrag(e);
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch events
        this.track.addEventListener('touchstart', (e) => {
            isDragging = true;
            this.handleDrag(e.touches[0]);
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                this.handleDrag(e.touches[0]);
            }
        });

        document.addEventListener('touchend', () => {
            isDragging = false;
        });

        // Prevent context menu
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    handleDrag(e) {
        const rect = this.track.getBoundingClientRect();
        let pos;
        
        if (this.options.vertical) {
            const mouseY = e.clientY - rect.top;
            const height = rect.height - this.thumb.offsetHeight;
            pos = 1 - (mouseY / height);
            pos = Math.max(0, Math.min(1, pos));
        } else {
            pos = (e.clientX - rect.left) / rect.width;
        }
        
        const value = Math.round(
            this.options.min + (this.options.max - this.options.min) * pos
        );
        
        this.setValue(value);
    }

    updateThumbPosition() {
        if (this.options.vertical) {
            const range = this.options.max - this.options.min;
            const percentage = ((this._value - this.options.min) / range);
            const height = this.track.offsetHeight - this.thumb.offsetHeight;
            const pos = height * (1 - percentage);
            this.thumb.style.top = `${pos}px`;
        } else {
            const range = this.options.max - this.options.min;
            const percent = ((this._value - this.options.min) / range) * 100;
            
            if (this.options.vertical) {
                this.thumb.style.left = '50%';
                this.thumb.style.bottom = `${percent}%`;
                this.thumb.style.top = 'auto';
                this.thumb.style.transform = 'translateX(-50%)';
            } else {
                this.thumb.style.left = `${percent}%`;
                this.thumb.style.top = '50%';
                this.thumb.style.transform = 'translate(-50%, -50%)';
            }
        }
    }

    updateDisplay() {
        this.updateThumbPosition();
        this.valueDisplay.textContent = this._value;
    }

    setValue(value) {
        const newValue = Math.min(Math.max(value, this.options.min), this.options.max);
        if (this._value !== newValue) {
            this._value = newValue;
            this.updateDisplay();
            this.emit('change', newValue);
        }
        return this;
    }

    getValue() {
        return this._value;
    }

    onMIDIValueChange(scaledValue, binding) {
        this.setValue(scaledValue);
    }

    startMIDILearn() {
        MIDILearnManager.startLearning(this);
    }

    // Hook methods
    onLearnStart() {
        this.element.classList.add('learning');
    }

    onLearnStop() {
        this.element.classList.remove('learning');
    }

    onMIDILearned(mapping) {}

    render(container) {
        container.appendChild(this.element);
        return this;
    }
}
