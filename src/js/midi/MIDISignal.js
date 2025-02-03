class MIDISignal {
    constructor(status, data1, data2) {
        this.timestamp = Date.now();
        this.status = status;
        this.data1 = data1;
        this.data2 = data2;
    }

    get type() {
        return this.status & 0xF0;
    }

    get channel() {
        return this.status & 0x0F;
    }

    get isNoteOn() {
        return this.type === MIDIMessageType.NOTE_ON && this.data2 > 0;
    }

    get isNoteOff() {
        return this.type === MIDIMessageType.NOTE_OFF || 
               (this.type === MIDIMessageType.NOTE_ON && this.data2 === 0);
    }

    get isControlChange() {
        return this.type === MIDIMessageType.CONTROL_CHANGE;
    }

    get isProgramChange() {
        return this.type === MIDIMessageType.PROGRAM_CHANGE;
    }

    get isPitchBend() {
        return this.type === MIDIMessageType.PITCH_BEND;
    }

    get controlNumber() {
        return this.isControlChange ? this.data1 : null;
    }

    get value() {
        if (this.isPitchBend) {
            return (this.data2 << 7) + this.data1;
        }
        return this.data2;
    }
}

export default MIDISignal;
