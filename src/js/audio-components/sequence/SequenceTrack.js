export default class SequenceTrack {
    constructor(id, length = 16, config = {}) {
        this.id = id;
        this.steps = new Array(length).fill(null);
        this.parameters = new Map();
        this.config = {
            defaultVelocity: config.defaultVelocity || 100,
            defaultProbability: config.defaultProbability || 1,
            defaultDuration: config.defaultDuration || 1,
            ...config
        };
    }

    setStep(index, value, params = {}) {
        if (index >= 0 && index < this.steps.length) {
            this.steps[index] = {
                value,
                velocity: params.velocity || this.config.defaultVelocity,
                probability: params.probability || this.config.defaultProbability,
                duration: params.duration || this.config.defaultDuration,
                ...params
            };
        }
    }

    getStep(index) {
        return this.steps[index]?.value || 0;
    }

    getStepData(index) {
        return this.steps[index] || { value: 0, params: {} };
    }

    setSteps(stepArray) {
        stepArray.forEach((step, index) => {
            if (index < this.steps.length) {
                this.setStep(index, step);
            }
        });
    }

    clear() {
        this.steps.fill(null);
    }

    setTrackConfig(key, value) {
        this.config[key] = value;
    }

    getTrackConfig(key) {
        return this.config[key];
    }

    resize(newLength) {
        const oldSteps = [...this.steps];
        this.steps = new Array(newLength).fill(null);
        
        // Preserva i vecchi valori dove possibile
        oldSteps.forEach((step, index) => {
            if (index < newLength) {
                this.steps[index] = step;
            }
        });
    }
}
