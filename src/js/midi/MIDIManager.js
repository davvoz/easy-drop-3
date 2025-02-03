import MIDISignal from './MIDISignal.js';
import MIDIMessageType from './MIDIMessageType.js';
import EventEmitter from '../utils/EventEmitter.js';

class MIDIManager extends EventEmitter {
    constructor() {
        super();
        this.midiAccess = null;
        this.listeners = new Set();
        this.statusElement = null;
        this.statusIndicator = null;
        this.lastActivity = 0;
    }

    async initialize() {
        this._setupStatusDisplay();
        if (this.midiAccess) return true;

        try {
            this.midiAccess = await navigator.requestMIDIAccess();
            this.midiInputs = Array.from(this.midiAccess.inputs.values());
            this.midiOutputs = Array.from(this.midiAccess.outputs.values());
            
            // Seleziona il primo output disponibile come default
            this.defaultOutput = this.midiOutputs[0];

            this._setupListeners();
            console.log('MIDI system initialized');
            return true;
        } catch (error) {
            console.error('MIDI system initialization failed:', error);
            return false;
        }
    }

    getDefaultOutput() {
        return this.defaultOutput;
    }

    sendMIDIMessage(channel, control, value) {
        if (this.defaultOutput) {
            const message = [
                0xB0 + (channel - 1), // Control Change
                control,
                value
            ];
            this.defaultOutput.send(message);
            console.log('Sending MIDI message:', message); // Debug
        }
    }

    _setupStatusDisplay() {
        // Attendiamo che il DOM sia pronto
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this._initStatusDisplay();
            });
        } else {
            this._initStatusDisplay();
        }
    }

    _initStatusDisplay() {
        this.statusElement = document.getElementById('midi-status');
        if (!this.statusElement) {
            console.error('MIDI status element not found');
            return;
        }
        this.statusIndicator = this.statusElement.querySelector('.indicator');
        this.statusText = this.statusElement.querySelector('.status-text');
        
        // Aggiorna subito lo stato iniziale
        this._updateStatus(false);
    }

    _updateStatus(connected, deviceName = '') {
        if (!this.statusElement) return;
        
        this.statusElement.classList.toggle('connected', connected);
        this.statusText.textContent = connected ? 
            `MIDI: Connected${deviceName ? ` (${deviceName})` : ''}` : 
            'MIDI: Disconnected';
    }

    _showActivity() {
        if (!this.statusElement) return;
        
        this.lastActivity = Date.now();
        this.statusElement.classList.add('active');
        
        // Rimuovi la classe 'active' dopo 100ms
        setTimeout(() => {
            if (Date.now() - this.lastActivity >= 100) {
                this.statusElement.classList.remove('active');
            }
        }, 100);
    }

    _setupListeners() {
        if (!this.midiAccess) return;
        
        // Rimuoviamo tutti i listener esistenti prima di aggiungerne di nuovi
        this.midiAccess.inputs.forEach(input => {
            input.onmidimessage = null;
        });
        
        // Aggiungiamo i nuovi listener
        this.midiAccess.inputs.forEach(input => {
            console.log('Setting up MIDI input:', input.name, input.manufacturer);
            input.onmidimessage = (msg) => this._handleMIDIMessage(msg);
            this._updateStatus(true, input.name);
        });

        // Listen for connection changes
        this.midiAccess.onstatechange = (e) => {
            const port = e.port;
            console.log('MIDI port state change:', port.name, port.state, port.type);
            
            if (port.type === 'input') {
                this._updateStatus(port.state === 'connected', port.name);
                
                // Invece di richiamare _setupListeners, gestiamo direttamente la singola porta
                if (port.state === 'connected') {
                    port.onmidimessage = (msg) => this._handleMIDIMessage(msg);
                } else {
                    port.onmidimessage = null;
                }
            }
        };
    }

    _handleMIDIMessage(message) {
        const [status, data1, data2] = message.data;
        const channel = status & 0x0F;
        const type = status & 0xF0;

        const signal = {
            type,
            channel: channel + 1,
            data1,
            value: data2 || 0,
            timestamp: Date.now()  // Aggiungiamo un timestamp
        };

        this._showActivity();
        
        // Emettiamo l'evento MIDI per tutti i listener
        this.emit('midiMessage', signal);
        
        // Notifica tutti i listener
        this.listeners.forEach(listener => {
            try {
                listener(signal);
            } catch (error) {
                console.error('Error in MIDI listener:', error);
            }
        });

        // Gestione learn mode
        if (this.tempLearnCallback) {
            this.tempLearnCallback(signal);
            this.tempLearnCallback = null;
        }
    }

    addListener(listener) {
        this.listeners.add(listener);
    }

    hasListener(listener) {
        return this.listeners.has(listener);
    }

    learn(callback) {
        this.tempLearnCallback = callback;
    }

    removeListener(listener) {
        this.listeners.delete(listener);
    }
}

export default new MIDIManager();
