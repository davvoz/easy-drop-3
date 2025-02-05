import AbstractAudioComponent from '../abstract/AbstractAudioComponent.js';

export default class SimpleOsc extends AbstractAudioComponent {
    constructor(id) {
        super(id);
        this.oscillator = null;
        this.gainNode = null;
        this.frequency = 440;
        this.waveform = 'sine';
        this.isPlaying = false;
        this.baseFrequency = 440;
        this.frequencyOffset = 0;
        this.baseVolume = 0;
        this.volumeOffset = 0;
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
        this.frequencyOffset = normalized;
        // Calcola la frequenza finale combinando il valore base con l'offset
        const finalFreq = this.baseFrequency * Math.pow(2, this.frequencyOffset * 4 - 2);
        this.frequency = finalFreq;
        
        if (this.oscillator) {
            this.oscillator.frequency.setTargetAtTime(this.frequency, this.audioContext.currentTime, 0.01);
        }
    }

    setVolume(value) {
        const normalizedGain = value / 127;
        this.baseVolume = normalizedGain;
        
        // Calcola il volume finale combinando il valore base con l'offset
        const finalVolume = Math.min(1, Math.max(0, this.baseVolume + this.volumeOffset));
        
        // Create new oscillator for new notes
        if (finalVolume > 0 && !this.isPlaying) {
            this.isPlaying = true;
            this._createOscillator();
        }

        // Apply volume change with slight envelope
        const now = this.audioContext.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setTargetAtTime(finalVolume, now, finalVolume > 0 ? 0.001 : 0.05);

        // Clean up oscillator when volume reaches 0
        if (finalVolume === 0) {
            setTimeout(() => {
                if (this.oscillator && this.gainNode.gain.value < 0.001) {
                    this.isPlaying = false;
                    this.oscillator.stop();
                    this.oscillator.disconnect();
                    this.oscillator = null;
                }
            }, 100);
        }
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

    setMidiFrequency(noteNumber) {
        this.baseFrequency = 440 * Math.pow(2, (noteNumber - 69) / 12);
        // Ricalcola la frequenza finale con l'offset corrente
        const finalFreq = this.baseFrequency * Math.pow(2, this.frequencyOffset * 4 - 2);
        this.frequency = finalFreq;
        
        if (this.oscillator) {
            this.oscillator.frequency.setTargetAtTime(this.frequency, this.audioContext.currentTime, 0.01);
        }
    }

    setMidiVolume(velocity) {
        this.baseVolume = velocity / 127;
        // Ricalcola il volume finale con l'offset corrente
        this.setVolume(this.baseVolume * 127);
    }

    triggerNote(velocity = 127, duration = 100, noteNumber) {
        console.log('Trigger note:', {
            velocity,
            duration,
            noteNumber
        });

        if (noteNumber !== undefined) {
            this.setMidiFrequency(noteNumber);
        }
        this.setMidiVolume(velocity);

        // Se c'è una durata, pianifica lo stop
        if (duration > 0) {
            setTimeout(() => {
                console.log('Duration elapsed, stopping note:', noteNumber);
                this.stopNote(noteNumber);
            }, duration);
        }
    }

    _isPlayingNote(noteNumber) {
        // Confronta direttamente il numero di nota MIDI invece della frequenza
        const currentNoteNumber = 69 + 12 * Math.log2(this.baseFrequency / 440);
        return Math.abs(currentNoteNumber - noteNumber) < 0.1;
    }

    stopNote(noteNumber) {
        // Se non c'è un oscillatore o non sta suonando, non fare nulla
        if (!this.oscillator || !this.isPlaying) return;

        console.log('Stopping note:', {
            noteNumber,
            currentFreq: this.baseFrequency,
            isPlaying: this.isPlaying
        });

        // Se questa è la nota attualmente in riproduzione, fermala
        if (this._isPlayingNote(noteNumber)) {
            console.log('Note match found, stopping...');
            
            const now = this.audioContext.currentTime;
            this.gainNode.gain.cancelScheduledValues(now);
            this.gainNode.gain.setTargetAtTime(0, now, 0.015);
            
            // Pulisci l'oscillatore dopo il release
            setTimeout(() => {
                if (this.oscillator) {
                    console.log('Cleaning up oscillator');
                    this.isPlaying = false;
                    this.oscillator.stop();
                    this.oscillator.disconnect();
                    this.oscillator = null;
                    this.baseVolume = 0;
                    this.baseFrequency = 440; // Reset alla frequenza base
                }
            }, 50); // Ridotto il tempo di cleanup
        }
    }
}
