export default class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.components = new Map();
        this.mixer = null;
        this.transport = null;
    }

    async initialize() {
        this.audioContext = new AudioContext();
        return this.audioContext;
    }

    setMixer(mixer) {
        this.mixer = mixer;
    }

    async addComponent(component, channel = 0) {
        if (!this.audioContext) throw new Error('AudioEngine not initialized');
        
        await component.initialize(this.audioContext);
        
        if (this.mixer) {
            const input = this.mixer.getChannelInput(channel);
            if (input) {
                component.connect(input);
            }
        }

        this.components.set(component.id, component);
        return component;
    }

    setTransport(transport) {
        this.transport = transport;
        transport.on('tick', (tickData) => {
            this.components.forEach(component => {
                component.transportTick(transport, tickData);
            });
        });
    }

    removeComponent(componentId) {
        const component = this.components.get(componentId);
        if (component) {
            component.dispose();
            this.components.delete(componentId);
        }
    }

    dispose() {
        this.components.forEach(component => component.dispose());
        this.components.clear();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
