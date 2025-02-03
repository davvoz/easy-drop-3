import ToggleButton from './ToggleButton.js';

export default class Radio extends ToggleButton {
    constructor(id, options = {}) {
        super(id, {
            ...options,
            className: `midi-radio ${options.className || ''}`
        });
        
        this.group = options.group || 'default';
        Radio.groups[this.group] = Radio.groups[this.group] || new Set();
        Radio.groups[this.group].add(this);
        this._active = false; // Ensure active state is initialized
    }

    initialize() {
        super.initialize();
        this.element.classList.add('radio-button');
        
        // Aggiungi l'indicatore radio
        const indicator = document.createElement('span');
        indicator.className = 'radio-indicator';
        this.element.insertBefore(indicator, this.element.firstChild);
    }

    static groups = {};

    isActive() {
        return this._active;
    }

    activate() {
        // First deactivate others in group
        if (Radio.groups[this.group]) {
            Radio.groups[this.group].forEach(radio => {
                if (radio !== this && radio._active) {
                    radio.deactivate();
                }
            });
        }
        
        this._active = true;
        this.element.classList.add('active');
        this.element.classList.add('radio-active');
        return super.activate();
    }

    deactivate() {
        this._active = false;
        this.element.classList.remove('active');
        this.element.classList.remove('radio-active');
        return super.deactivate();
    }

    dispose() {
        if (Radio.groups[this.group]) {
            Radio.groups[this.group].delete(this);
            if (Radio.groups[this.group].size === 0) {
                delete Radio.groups[this.group];
            }
        }
    }
}
