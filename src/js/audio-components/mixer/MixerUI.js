import AbstractAudioComponentUI from '../abstract/AbstractAudioComponentUI.js';
import Slider from '../../ui-components/Slider.js';
import Knob from '../../ui-components/Knob.js';
import ToggleButton from '../../ui-components/ToggleButton.js';

export default class MixerUI extends AbstractAudioComponentUI {
    constructor(mixer, options = {}) {
        super(mixer, {
            className: 'mixer-component',
            sequencerType: null, // Il mixer non ha sequencer
            ...options
        });
    }

    buildUI() {
        // Create channels strip container
        const channelsContainer = document.createElement('div');
        channelsContainer.className = 'mixer-channels';

        // Create channel strips
        for (let i = 0; i < this.component.channelCount; i++) {
            const strip = this.createChannelStrip(i);
            channelsContainer.appendChild(strip);
        }

        // Create master section
        const masterSection = this.createMasterSection();

        // Add all to container
        this.container.appendChild(channelsContainer);
        this.container.appendChild(masterSection);
    }

    createChannelStrip(channel) {
        const strip = document.createElement('div');
        strip.className = 'mixer-channel';

        // Pan knob
        const panContainer = document.createElement('div');
        panContainer.className = 'pan-container';
        const pan = new Knob(panContainer, {
            id: `ch${channel}-pan`,
            min: 0,
            max: 127,
            value: 64,  // Center position
            size: 40,
            bipolar: true  // Add this if your Knob component supports bipolar display
        });
        this.addControl(`ch${channel}-pan`, pan);
        pan.render();

        // Volume fader with VU meter
        const fader = new Slider(`ch${channel}-volume`, {
            min: 0,
            max: 127,
            value: 100,
            vertical: true,
            className: 'midi-slider vertical',
        });
        this.addControl(`ch${channel}-volume`, fader);

        // Controls container per mute/solo
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'channel-controls';

        // Mute button
        const muteBtn = new ToggleButton(`ch${channel}-mute`, {
            label: 'M',
            className: 'midi-toggle-button mute-button'
        });
        this.addControl(`ch${channel}-mute`, muteBtn);

        // Solo button
        const soloBtn = new ToggleButton(`ch${channel}-solo`, {
            label: 'S',
            className: 'midi-toggle-button solo-button'
        });
        this.addControl(`ch${channel}-solo`, soloBtn);

        // Append in ordine corretto
        strip.appendChild(panContainer);
        fader.render(strip);
        muteBtn.render(controlsContainer);
        soloBtn.render(controlsContainer);
        strip.appendChild(controlsContainer);

        return strip;
    }

    createMasterSection() {
        const master = document.createElement('div');
        master.className = 'mixer-master';

        const masterFader = new Slider('master-volume', {
            min: 0,
            max: 127,
            value: 64,
            vertical: true,
            className: 'midi-slider vertical'
        });
        this.addControl('master-volume', masterFader);

        masterFader.render(master);
        return master;
    }

    setupEventListeners() {
        // Set up channel controls
        for (let i = 0; i < this.component.channelCount; i++) {
            const volumeFader = this.getControl(`ch${i}-volume`);
            const panKnob = this.getControl(`ch${i}-pan`);

            volumeFader.on('change', (value) => {
                this.component.setChannelVolume(i, value);
            });

            panKnob.on('change', ({ value }) => {
                this.component.setChannelPan(i, value);
            });

            const muteBtn = this.getControl(`ch${i}-mute`);
            const soloBtn = this.getControl(`ch${i}-solo`);

            muteBtn.on('change', (active) => {
                this.component.setChannelMute(i, active);
            });

            soloBtn.on('change', (active) => {
                this.component.setChannelSolo(i, active);
            });
        }

        // Set up master controls
        const masterFader = this.getControl('master-volume');
        masterFader.on('change', (value) => {
            this.component.setMasterVolume(value);
        });
    }

    cleanup() {
        // Clean up VU meters
        for (let i = 0; i < this.component.channelCount; i++) {
            const fader = this.getControl(`ch${i}-volume`);
            if (fader.cleanup) {
                fader.cleanup();
            }
        }
        super.cleanup();
    }
}
