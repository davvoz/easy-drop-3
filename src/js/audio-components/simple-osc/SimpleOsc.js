import AbstractAudioComponent from '../abstract/AbstractAudioComponent.js';

export default class SimpleOsc extends AbstractAudioComponent {
    constructor(id) {
        super(id);
        this.oscillator = null;
        this.gainNode = null;
        this.frequency = 440;
        this.waveform = 'sine';
        this.isPlaying = false;
    }

    async setup() {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0;
    }

    _createOscillator() {
        console.log('Creating oscillator with:', {
            waveform: this.waveform,
            frequency: this.frequency,
            isPlaying: this.isPlaying
        });

        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
        }

        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.type = this.waveform;
        this.oscillator.frequency.value = this.frequency;
        this.oscillator.connect(this.gainNode);
        this.oscillator.start();
    }

    setWaveform(type) {
        console.log('SimpleOsc setWaveform called with:', {
            type,
            isPlaying: this.isPlaying,
            hasOscillator: !!this.oscillator,
            currentWaveform: this.waveform
        });

        // Cambia subito il tipo dell'oscillatore se esiste
        if (this.oscillator) {
            try {
                this.oscillator.type = type;
                console.log('Changed oscillator type directly');
            } catch (error) {
                console.error('Failed to set oscillator type:', error);
            }
        }

        this.waveform = type;

        // Se non c'è un oscillatore ma stiamo suonando, ricrealo
        if (!this.oscillator && this.isPlaying) {
            console.log('Recreating oscillator because playing but no oscillator');
            this._createOscillator();
        }
    }

    setFrequency(value) {
        const normalized = value / 127;
        this.frequency = 20 * Math.pow(100, normalized);
        
        // Aggiorna la frequenza solo se l'oscillatore esiste
        if (this.oscillator) {
            this.oscillator.frequency.setTargetAtTime(this.frequency, this.audioContext.currentTime, 0.01);
        }
    }

    setVolume(value) {
        const normalizedGain = value / 127;
        
        if (normalizedGain > 0 && !this.isPlaying) {
            this.isPlaying = true;
            this._createOscillator();
        } else if (normalizedGain === 0 && this.isPlaying) {
            this.isPlaying = false;
            if (this.oscillator) {
                const currentTime = this.audioContext.currentTime;
                this.oscillator.stop(currentTime);
                this.oscillator.disconnect();
                this.oscillator = null;
            }
        }

        this.gainNode.gain.setTargetAtTime(normalizedGain, this.audioContext.currentTime, 0.01);
    }

    connect(destination) {
        this.gainNode.connect(destination);
    }

    disconnect() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
        }
        this.gainNode.disconnect();
    }

    transportTick(transport, { beat, tick }) {
        // Override AbstractAudioComponent's transportTick
        this.emit('tick', { beat, tick });
    }

    triggerNote(velocity = 127, duration = 100) {
        this.setVolume(velocity);
        setTimeout(() => {
            this.setVolume(0);
        }, duration);
    }
}
