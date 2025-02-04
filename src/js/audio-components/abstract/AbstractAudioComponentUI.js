import EventEmitter from '../../utils/EventEmitter.js';

export default class AbstractAudioComponentUI extends EventEmitter {
    constructor(component, options = {}) {
        super();
        this.component = component;
        this.container = null;
        this.options = {
            className: 'audio-component',
            ...options
        };

        this.controls = new Map();
    }

    render(container) {
        if (!container) {
            throw new Error('Container element must be provided for rendering');
        }
        
        this.container = container;
        this.container.className = this.options.className;
        
        try {
            this.buildUI();
            this.setupEventListeners();
        } catch (error) {
            console.error(`UI Build error for component ${this.component.id}:`, error);
            this.container.innerHTML = `<div class="error">Component rendering failed: ${error.message}</div>`;
        }
        
        return this.container;
    }

    buildUI() {
        // Override in subclass to create UI elements
        throw new Error('buildUI() must be implemented by subclass');
    }

    setupEventListeners() {
        // Override in subclass to set up event listeners
        throw new Error('setupEventListeners() must be implemented by subclass');
    }

    addControl(id, control) {
        this.controls.set(id, control);
        return control;
    }

    getControl(id) {
        return this.controls.get(id);
    }

    dispose() {
        this.controls.forEach(control => {
            if (control.dispose) control.dispose();
        });
        this.controls.clear();
        this.container.innerHTML = '';
    }
}
