const MIDIMessageType = {
    NOTE_ON: 0x90,
    NOTE_OFF: 0x80,
    CONTROL_CHANGE: 0xB0,
    PROGRAM_CHANGE: 0xC0,
    PITCH_BEND: 0xE0
};

Object.freeze(MIDIMessageType);

export default MIDIMessageType;
