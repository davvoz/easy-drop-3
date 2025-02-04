import AbstractAudioComponent from '../abstract/AbstractAudioComponent.js';

export default class Mixer extends AbstractAudioComponent {
    constructor(id, channelCount = 2) {
        super(id);
        this.channelCount = channelCount;
        this.channels = new Map();
        this.masterGainNode = null;
        this.soloChannels = new Set();
    }

    async setup() {
        this.masterGainNode = this.audioContext.createGain();
        
        // Create channels
        for (let i = 0; i < this.channelCount; i++) {
            const channel = {
                input: this.audioContext.createGain(),
                pan: this.audioContext.createStereoPanner(),
                gain: this.audioContext.createGain(),
                muted: false
            };
            
            // Connect channel nodes
            channel.input
                .connect(channel.pan)
                .connect(channel.gain)
                .connect(this.masterGainNode);
                
            this.channels.set(i, channel);
        }
    }

    connect(destination) {
        this.masterGainNode.connect(destination);
    }

    disconnect() {
        this.masterGainNode.disconnect();
        this.channels.forEach(channel => {
            channel.input.disconnect();
            channel.pan.disconnect();
            channel.gain.disconnect();
        });
    }

    setChannelVolume(channel, value) {
        const ch = this.channels.get(channel);
        if (ch) {
            const gain = Math.pow(value / 127, 2);
            ch.gain._targetGain = gain;
            if (!ch.muted && (this.soloChannels.size === 0 || this.soloChannels.has(channel))) {
                ch.gain.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.01);
            }
        }
    }

    setChannelPan(channel, value) {
        const ch = this.channels.get(channel);
        if (ch) {
            // Convert from MIDI range (0-127) to pan range (-1 to 1)
            const normalizedPan = (value - 64) / 63;
            ch.pan.pan.setTargetAtTime(normalizedPan, this.audioContext.currentTime, 0.01);
        }
    }

    setMasterVolume(value) {
        // Aggiungiamo curva logaritmica anche qui
        const gain = Math.pow(value, 2);
        this.masterGainNode.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.01);
    }

    getChannelInput(channel) {
        const ch = this.channels.get(channel);
        return ch ? ch.input : null;
    }

    setChannelMute(channel, muted) {
        const ch = this.channels.get(channel);
        if (ch) {
            ch.muted = muted;
            this._updateChannelState(channel);
        }
    }

    setChannelSolo(channel, soloed) {
        if (soloed) {
            this.soloChannels.add(channel);
        } else {
            this.soloChannels.delete(channel);
        }
        this._updateAllChannelsState();
    }

    _updateChannelState(channel) {
        const ch = this.channels.get(channel);
        if (!ch) return;

        const shouldPlay = !ch.muted && 
            (this.soloChannels.size === 0 || this.soloChannels.has(channel));
        
        ch.gain.gain.setTargetAtTime(
            shouldPlay ? ch.gain._targetGain || 1 : 0,
            this.audioContext.currentTime,
            0.01
        );
    }

    _updateAllChannelsState() {
        for (let i = 0; i < this.channelCount; i++) {
            this._updateChannelState(i);
        }
    }
}
