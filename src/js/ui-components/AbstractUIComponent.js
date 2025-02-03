import MIDIManager from '../midi/MIDIManager.js';
import MIDIMessageType from '../midi/MIDIMessageType.js';
import EventEmitter from '../utils/EventEmitter.js';
import IMIDIBinding from '../interfaces/IMIDIBinding.js';
import MIDILogger from '../utils/MIDILogger.js';

export default class AbstractUIComponent extends EventEmitter {
    constructor(id) {
        super();
        this.id = id;
        this.element = null;
        this._midiListener = null;
        this.midiControl = null;
        this.midiChannel = null;
        this.midiValue = 0;
        this.midiMinValue = 0;
        this.midiMaxValue = 127;

        // Bind the MIDI message handler
        this.handleMIDIMessage = this.handleMIDIMessage.bind(this);

        this.midiBindings = new Map();
        this.midiType = null;
    }

    render() {
        throw new Error('render() method must be implemented');
    }

    destroy() {
        if (this._midiListener) {
            MIDIManager.removeListener(this._midiListener);
            this._midiListener = null;
        }
        
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.events.clear();
    }

    assignMIDIControl(channel, control, type = MIDIMessageType.CONTROL_CHANGE) {
        console.log(`Assigning MIDI control to ${this.id}:`, { channel, control, type });
        const binding = new IMIDIBinding(channel, control, type);
        
        if (this.midiBindings.has(binding.key)) {
            return;
        }

        this.midiBindings.set(binding.key, binding);
        
        if (!MIDIManager.hasListener(this.handleMIDIMessage)) {
            MIDIManager.addListener(this.handleMIDIMessage);
        }

        this.emit('midiAssign', binding);
        MIDILogger.log(this.id, 'MIDI Control Assigned', {
            channel,
            control,
            type
        });

        if (this.element) {
            this.element.setAttribute('data-midi-mapping', `${channel}:${control}:${type}`);
        }
        return this;
    }

    removeMIDIControl(channel, control, type = MIDIMessageType.CONTROL_CHANGE) {
        const key = `${channel}-${control}-${type}`;
        this.midiBindings.delete(key);

        if (this.midiBindings.size === 0) {
            MIDIManager.removeListener(this.handleMIDIMessage);
        }
    }

    handleMIDIMessage(signal) {
        const key = `${signal.channel}-${signal.data1}-${signal.type}`;
        const binding = this.midiBindings.get(key);

        if (!binding) return;

        console.log(`MIDI Message for ${this.id}:`, signal);
        
        // Log MIDI input
        MIDILogger.log(this.id, 'MIDI Input', {
            channel: signal.channel,
            control: signal.data1,
            type: signal.type,
            value: signal.value
        });

        binding.value = signal.value;
        const scaledValue = this.scaleMIDIValue(binding);
        this.onMIDIValueChange(scaledValue, binding);
    }

    scaleMIDIValue(binding) {
        // Modifica qui per avere il valore MIDI diretto
        return binding.value;
    }

    setMIDIRange(min, max, channel, control, type = MIDIMessageType.CONTROL_CHANGE) {
        const key = `${channel}-${control}-${type}`;
        const binding = this.midiBindings.get(key);
        if (binding) {
            binding.minValue = min;
            binding.maxValue = max;
        }
    }

    onMIDIValueChange(scaledValue, binding) {
        // Override this method in child classes to handle MIDI value changes
    }
}
