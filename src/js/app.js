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
import Sequencer from './audio-components/sequencer/Sequencer.js';
import SequencerUI from './audio-components/sequencer/SequencerUI.js';
import PianoRoll from './audio-components/piano-roll/PianoRoll.js';
import PianoRollUI from './audio-components/piano-roll/PianoRollUI.js';

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
        const mixer = new Mixer('mainMixer', 1);
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

        // Set up transport in AudioEngine
        audioEngine.setTransport(transport);

        // Create sequencer with custom grid size
        // const sequencer = new Sequencer('seq-1', {
        //     rows: 4,      // Puoi modificare questi valori
        //     columns: 8,   // per ottenere griglie diverse
        // });
        // await audioEngine.addComponent(sequencer);
        
        // // Connect sequencer to oscillator
        // sequencer.setInstrument(osc);
        
        // // Add sequencer to transport
        // transport.addSequence(sequencer);
        
        // const sequencerUI = new SequencerUI(sequencer);
        // renderEngine.addComponent(sequencerUI);

        // Create piano roll with appropriate settings
        const pianoRoll = new PianoRoll('piano-1', {
            rows: 24,      // 2 ottave
            columns: 16,   // Una battuta
            startNote: 48, // C3
            pixelsPerStep: 30,
            stepsPerBeat: 4,
            beatsPerBar: 1
        });
        await audioEngine.addComponent(pianoRoll);

        // Connect piano roll to oscillator
        pianoRoll.setInstrument(osc);

        // Add piano roll to transport (importante!)
        transport.addSequence(pianoRoll);

        const pianoRollUI = new PianoRollUI(pianoRoll);
        renderEngine.addComponent(pianoRollUI);

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
