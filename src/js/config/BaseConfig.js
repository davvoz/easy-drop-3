import EventEmitter from '../utils/EventEmitter.js';

export default class BaseConfig extends EventEmitter {
    constructor(defaultConfig = {}) {
        super();
        this._config = new Map();
        this._presets = new Map();
        this.setDefaults(defaultConfig);
    }

    setDefaults(config) {
        Object.entries(config).forEach(([key, value]) => {
            this._config.set(key, value);
        });
    }

    set(key, value) {
        this._config.set(key, value);
        this.emit('configChanged', { key, value });
    }

    get(key) {
        return this._config.get(key);
    }

    getAll() {
        return Object.fromEntries(this._config);
    }

    savePreset(name, config) {
        this._presets.set(name, {...Object.fromEntries(this._config), ...config});
    }

    loadPreset(name) {
        const preset = this._presets.get(name);
        if (preset) {
            Object.entries(preset).forEach(([key, value]) => this.set(key, value));
            this.emit('presetLoaded', name);
        }
    }
}
