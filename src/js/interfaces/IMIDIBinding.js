export default class IMIDIBinding {
    constructor(channel, control, type) {
        this.channel = channel;
        this.control = control;
        this.type = type;
        this.value = 0;
        this.minValue = 0;
        this.maxValue = 127;
    }

    get key() {
        return `${this.channel}-${this.control}-${this.type}`;
    }
}
