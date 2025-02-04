import Toggle from './Toggle.js';
import MIDIManager from '../midi/MIDIManager.js';

export default class ToggleButton extends Toggle {
    constructor(id, options = {}) {
        super(id, {
            ...options,
            className: options.className || 'midi-toggle-button'
        });
        
        this.options.label = options.label || '';
    }

    initialize() {
        super.initialize();
        
        this.element = document.createElement('button');
        this.element.id = this.id;
        this.element.className = this.options.className;
        this.element.textContent = this.options.label;

        this.element.addEventListener('click', () => this.toggle());
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.startMIDILearn();
        });
    }

    activate() {
        super.activate();
        this.element.classList.add('active');
        if (this.midiMapping) {
            MIDIManager.sendMIDIMessage(
                this.midiMapping.channel,
                this.midiMapping.control,
                127
            );
        }
        return this;
    }

    deactivate() {
        super.deactivate();
        this.element.classList.remove('active');
        if (this.midiMapping) {
            MIDIManager.sendMIDIMessage(
                this.midiMapping.channel,
                this.midiMapping.control,
                0
            );
        }
        return this;
    }

    setActive(active, emitEvent = true) {
        this.isActive = active;
        this.element.classList.toggle('active', active);
        this.updateLabel();
        if (emitEvent) {
            this.emit('change', active);
        }
    }

    updateLabel() {
        if (this.element) {
            this.element.textContent = this.isActive ? this.options.activeLabel : this.options.label;
        }
    }

    onLearnStart() {
        this.element.classList.add('learning');
    }

    onLearnStop() {
        this.element.classList.remove('learning');
    }

    onMIDILearned(mapping) {
        this.element.setAttribute('data-midi-mapping', 
            `${mapping.channel}:${mapping.control}:${mapping.type}`);
    }

    render(container) {
        container.appendChild(this.element);
        return this;
    }

    setLabel(label) {
        this.options.label = label;
        this.element.textContent = label;
        return this;
    }
}
