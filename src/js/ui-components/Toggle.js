import AbstractUIComponent from './AbstractUIComponent.js';
import MIDIMessageType from '../midi/MIDIMessageType.js';
import MIDILearnManager from '../midi/MIDILearnManager.js';

export default class Toggle extends AbstractUIComponent {
    constructor(id, options = {}) {
        super(id);
        
        this.options = {
            className: options.className || 'midi-toggle',
            ...options
        };

        this.isActive = false;
        this.isLearning = false;
        this.initialize();
    }

    initialize() {
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
    }

    startMIDILearn() {
        MIDILearnManager.startLearning(this);
    }

    activate() {
        this.isActive = true;
        this.emit('activate', this);
        return this;
    }

    deactivate() {
        this.isActive = false;
        this.emit('deactivate', this);
        return this;
    }

    toggle() {
        this.isActive ? this.deactivate() : this.activate();
        return this;
    }

    onMIDIValueChange(scaledValue, binding) {
        console.log('Toggle MIDI Value Change:', {
            value: scaledValue,
            bindingType: binding.type,
            currentState: this.isActive
        });

        if (binding.type === MIDIMessageType.NOTE_ON) {
            // Se riceviamo un NOTE_ON con velocity 0, trattiamolo come NOTE_OFF
            if (scaledValue === 0) {
                this.deactivate();
            } else {
                // Altrimenti toggleiamo lo stato
                this.toggle();
            }
        } else if (binding.type === MIDIMessageType.NOTE_OFF) {
            // Opzionale: potresti voler commentare questa parte se preferisci
            // che il NOTE_OFF non faccia nulla
            this.deactivate();
        } else if (binding.type === MIDIMessageType.CONTROL_CHANGE) {
            scaledValue > 64 ? this.activate() : this.deactivate();
        }
    }

    isActive() {
        return this._active;
    }

    // Hook methods to be overridden by subclasses
    onLearnStart() {}
    onLearnStop() {}
    onMIDILearned(mapping) {}
}
