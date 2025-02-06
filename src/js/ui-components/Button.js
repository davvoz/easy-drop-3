import AbstractUIComponent from './AbstractUIComponent.js';
import MIDIMessageType from '../midi/MIDIMessageType.js';
import MIDILearnManager from '../midi/MIDILearnManager.js';

export default class Button extends AbstractUIComponent {
    constructor(id, options = {}) {
        super(id);
        
        this.options = {
            label: options.label || '',
            className: options.className || 'midi-button',
            ...options
        };

        this.isLearning = false;
        this.initialize();
    }

    initialize() {
        this.element = document.createElement('button');
        this.element.id = this.id;
        this.element.className = this.options.className;
        this.element.textContent = this.options.label;

        this.setupEventListeners();
        this.setupMIDILearnSupport();
    }

    setupEventListeners() {
        this.element.addEventListener('click', () => this.trigger());
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.startMIDILearn();
        });
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

    startMIDILearn() {
        MIDILearnManager.startLearning(this);
    }

    onMIDIValueChange(scaledValue, binding) {
        if (binding.type === MIDIMessageType.NOTE_ON) {
            if (scaledValue > 0) {
                this.trigger();
            }
        } else if (binding.type === MIDIMessageType.CONTROL_CHANGE) {
            if (scaledValue > 64 && !this._lastMidiState) {
                this._lastMidiState = true;
                this.trigger();
            } else if (scaledValue <= 64) {
                this._lastMidiState = false;
            }
        }
    }

    trigger() {
        console.log('Button triggered');
        
        // Visual feedback
        this.element.classList.remove('flash-button');
        void this.element.offsetWidth; // Force reflow
        this.element.classList.add('flash-button');
        
        // Emit event
        this.emit('trigger', this);
        
        // Remove visual feedback
        setTimeout(() => {
            this.element.classList.remove('flash-button');
        }, 150);
    }

    onLearnStart() {
        this.element.classList.add('learning');
    }

    onLearnStop() {
        this.element.classList.remove('learning');
    }

    onMIDILearned(mapping) {
        // Rimuoviamo assignMIDIControl da qui poiché verrà chiamato da MIDILearnManager
        if (this.element) {
            this.element.setAttribute('data-midi-mapping', 
                `${mapping.channel}:${mapping.control}:${mapping.type}`);
        }
    }

    setLabel(label) {
        this.options.label = label;
        this.element.textContent = label;
        return this;
    }

    render(container) {
        if (container) {
            container.appendChild(this.element);
        }
        return this.element; // Importante: ritorniamo l'elemento DOM
    }
}

