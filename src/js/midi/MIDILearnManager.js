import MIDIManager from './MIDIManager.js';
import EventEmitter from '../utils/EventEmitter.js';

class MIDILearnManager extends EventEmitter {
    constructor() {
        super();
        this.isLearning = false;
        this.currentComponent = null;
        this.mappings = new Map();
    }

    startLearning(component) {
        if (this.isLearning) {
            this.stopLearning();
        }

        this.isLearning = true;
        this.currentComponent = component;
        this.emit('learnStart', component);

        MIDIManager.learn(this.handleMIDILearn.bind(this));
    }

    stopLearning() {
        if (this.currentComponent) {
            this.isLearning = false;
            this.emit('learnStop', this.currentComponent);
            this.currentComponent = null;
        }
    }

    handleMIDILearn(signal) {
        if (!this.currentComponent || !this.isLearning) return;

        console.log('Learning MIDI signal:', signal);

        const mapping = {
            componentId: this.currentComponent.id,
            channel: signal.channel,
            control: signal.data1,
            type: signal.type
        };

        console.log('Created mapping:', mapping);

        // Salviamo il mapping
        this.mappings.set(this.currentComponent.id, mapping);
        
        // Qui assegniamo il controllo MIDI una sola volta
        if (typeof this.currentComponent.assignMIDIControl === 'function') {
            this.currentComponent.assignMIDIControl(signal.channel, signal.data1, signal.type);
        }
        
        // Usa l'istanza corretta di MIDIManager
        if (this.currentComponent.setMIDIOutput) {
            this.currentComponent.setMIDIOutput(MIDIManager.getDefaultOutput());
        }
        
        // Notifica il componente del mapping
        if (this.currentComponent.onMIDILearned) {
            this.currentComponent.onMIDILearned(mapping);
        }
        
        // Emettiamo l'evento learned per aggiornare l'UI
        this.emit('learned', { component: this.currentComponent, mapping });
        
        this.stopLearning();
    }

    saveMappings() {
        const mappingsObj = Object.fromEntries(this.mappings);
        localStorage.setItem('midiMappings', JSON.stringify(mappingsObj));
    }

    loadMappings() {
        try {
            const stored = localStorage.getItem('midiMappings');
            if (stored) {
                const mappingsObj = JSON.parse(stored);
                this.mappings = new Map(Object.entries(mappingsObj));
                return true;
            }
        } catch (e) {
            console.error('Failed to load MIDI mappings:', e);
        }
        return false;
    }

    async initialize() {
        // Prima inizializziamo MIDIManager
        const midiInitialized = await MIDIManager.initialize();
        if (!midiInitialized) {
            console.error('MIDI system initialization failed');
            return false;
        }

        // Poi carichiamo i mapping
        if (this.loadMappings()) {
            console.log('MIDI mappings loaded');
        }
        return true;
    }
}

export default new MIDILearnManager();
