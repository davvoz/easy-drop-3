import EventEmitter from '../../utils/EventEmitter.js';

export default class AbstractAudioComponent extends EventEmitter {
    constructor(id) {
        super();
        this.id = id;
        this.audioContext = null;
        this.isInitialized = false;
    }

    async initialize(audioContext) {
        if (this.isInitialized) return;
        
        this.audioContext = audioContext;
        this.isInitialized = true;
        await this.setup();
    }

    async setup() {
        // Override in subclass to set up audio nodes
        throw new Error('setup() must be implemented by subclass');
    }

    connect(destination) {
        // Override in subclass to handle connections
        throw new Error('connect() must be implemented by subclass');
    }

    disconnect() {
        // Override in subclass to handle disconnections
        throw new Error('disconnect() must be implemented by subclass');
    }

    dispose() {
        this.disconnect();
        this.isInitialized = false;
    }

    transportTick(transport, beat) {
        // Override in subclass to handle transport ticks
    }
}
