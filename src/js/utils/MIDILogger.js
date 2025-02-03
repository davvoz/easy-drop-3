class MIDILogger {
    constructor() {
        this.logElement = null;
        this.maxLogs = 50;
        this.logs = [];
        this.isVisible = true;
    }

    initialize() {
        this.createLogElement();
        this.createToggleButton();
    }

    createLogElement() {
        this.logElement = document.createElement('div');
        this.logElement.className = 'midi-log';
        document.body.appendChild(this.logElement);
    }

    createToggleButton() {
        const toggle = document.createElement('button');
        toggle.className = 'midi-log-toggle';
        toggle.innerHTML = '📋';
        toggle.title = 'Toggle MIDI Log';
        
        toggle.addEventListener('click', () => this.toggleVisibility());
        
        document.body.appendChild(toggle);
    }

    toggleVisibility() {
        this.isVisible = !this.isVisible;
        if (this.logElement) {
            this.logElement.style.display = this.isVisible ? 'block' : 'none';
        }
        const toggle = document.querySelector('.midi-log-toggle');
        if (toggle) {
            toggle.classList.toggle('active', this.isVisible);
        }
    }

    log(componentId, message, data) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            componentId,
            message,
            data
        };

        this.logs.unshift(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
        }

        this.updateDisplay();
    }

    updateDisplay() {
        if (!this.logElement) return;

        this.logElement.innerHTML = this.logs
            .map(entry => `
                <div class="log-entry">
                    <span class="timestamp">${entry.timestamp}</span>
                    <span class="component">${entry.componentId}</span>
                    <span class="message">${entry.message}</span>
                    <span class="data">${JSON.stringify(entry.data)}</span>
                </div>
            `)
            .join('');
    }

    clear() {
        this.logs = [];
        this.updateDisplay();
    }
}

export default new MIDILogger();
