import MIDILearnManager from './midi/MIDILearnManager.js';
import MIDILogger from './utils/MIDILogger.js';
import Mixer from './audio-components/mixer/Mixer.js';
import MixerUI from './audio-components/mixer/MixerUI.js';
import SimpleOsc from './audio-components/simple-osc/SimpleOsc.js';
import SimpleOscUI from './audio-components/simple-osc/SimpleOscUI.js';
import AudioEngine from './engines/AudioEngine.js';
import RenderEngine from './engines/RenderEngine.js';
import Transport from './audio-components/transport/Transport.js';
import TransportUI from './audio-components/transport/TransportUI.js';
import Sequence from './audio-components/sequence/Sequence.js';
import SequenceUI from './audio-components/sequence/SequenceUI.js';

async function initializeApp() {
    try {
        // Ensure DOM is ready first
        if (document.readyState === 'loading') {
            await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }

        const controlsContainer = document.getElementById('controls');
        if (!controlsContainer) {
            throw new Error('Controls container element not found');
        }
        controlsContainer.className = 'center-container';

        // Initialize MIDI Logger
        MIDILogger.initialize();

        // Initialize MIDI system
        const midiInitialized = await MIDILearnManager.initialize();
        if (!midiInitialized) {
            controlsContainer.innerHTML = `
                <div class="warning">
                    MIDI support not available. Please ensure you're using Chrome with a MIDI device connected.
                </div>`;
            return;
        }

        const renderEngine = new RenderEngine(controlsContainer);
        const audioEngine = new AudioEngine();
        await audioEngine.initialize();

        // Create and initialize components
        const mixer = new Mixer('mainMixer', 4);
        await audioEngine.addComponent(mixer);
        audioEngine.setMixer(mixer);
        mixer.connect(audioEngine.audioContext.destination);

        const mixerUI = new MixerUI(mixer);
        renderEngine.addComponent(mixerUI);

        // Create oscillator
        const osc = new SimpleOsc('osc-1');
        await audioEngine.addComponent(osc);
        
        // Colleghiamo l'oscillatore al primo canale del mixer usando il metodo corretto
        const channel0Input = mixer.getChannelInput(0);
        if (channel0Input) {
            osc.connect(channel0Input);
        } else {
            console.error('Mixer channel 0 not available');
        }
        
        const oscUI = new SimpleOscUI(osc);
        renderEngine.addComponent(oscUI);

        // Create transport
        const transport = new Transport('main-transport');
        await audioEngine.addComponent(transport);
        
        const transportUI = new TransportUI(transport);
        renderEngine.addComponent(transportUI);

        // Create sequence
        const sequence = new Sequence('seq-1', { length: 16 });
        const oscTrack = sequence.addTrack('osc-1');
        
        // Create a simple pattern (1 = trigger, 0 = silence)
        oscTrack.setSteps([
            1, 0, 0, 0,  // Beat 1
            1, 0, 0, 0,  // Beat 2
            1, 0, 0, 0,  // Beat 3
            1, 0, 1, 0   // Beat 4
        ]);

        // Add sequence to transport
        transport.addSequence(sequence);

        // Create sequence UI
        const sequenceUI = new SequenceUI(sequence);
        renderEngine.addComponent(sequenceUI);

        // Listen for sequence triggers
        sequence.on('trigger', ({ trackId, tick, data }) => {
            if (trackId === 'osc-1') {
                osc.triggerNote(127, 100); // velocity 127, duration 100ms
                
                // Highlight current step
                const buttons = sequenceUI.gridButtons;
                buttons.forEach(btn => btn.element.classList.remove('playing'));
                if (buttons[tick]) {
                    buttons[tick].element.classList.add('playing');
                }
            }
        });

        // Set up transport in AudioEngine
        audioEngine.setTransport(transport);

        // Now you can use transport controls to start/stop the sequence
        transport.setBPM(120);
        // transport.start(); // Will start the sequence

    } catch (error) {
        console.error('Application initialization failed:', error);
        throw new Error(`App initialization failed: ${error.message}`);
    }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
